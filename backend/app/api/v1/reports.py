import io
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import (
    Transaction, TransactionType, Invoice, InvoiceStatus, Client, Project, UserProfile
)
from backend.app.engine.calculations import FinancialEngine, to_decimal, round_money
from backend.app.engine.money import from_cents, convert

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/profit-loss")
def get_profit_and_loss(
    start_date: date,
    end_date: date,
    currency: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    target_curr = (currency or (profile.base_currency if profile else "USD")).upper()

    # Income transactions
    income_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.INCOME,
        Transaction.status == "CONFIRMED",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()

    # tx.amount and tx.fee_amount are integer cents — convert() returns display Decimal
    gross_revenue = sum(
        (convert(tx.amount, tx.currency, target_curr) for tx in income_txs),
        Decimal("0.00")
    )
    platform_fees = sum(
        (convert(tx.fee_amount, tx.currency, target_curr) for tx in income_txs if tx.fee_amount),
        Decimal("0.00")
    )
    net_revenue = gross_revenue - platform_fees

    # Income category breakdown
    income_by_category: Dict[str, Decimal] = {}
    for tx in income_txs:
        cat = tx.category.name if tx.category else "General Income"
        fee_cents = tx.fee_amount or 0
        net_cents = (tx.amount or 0) - fee_cents
        tx_net = convert(net_cents, tx.currency, target_curr)
        income_by_category[cat] = income_by_category.get(cat, Decimal("0.00")) + tx_net

    # Business Expense transactions
    biz_expenses = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.is_business == True,
        Transaction.status == "CONFIRMED",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()

    total_biz_expenses = sum(
        (convert(tx.amount, tx.currency, target_curr) for tx in biz_expenses),
        Decimal("0.00")
    )

    # Expense category breakdown
    expense_by_category: Dict[str, Decimal] = {}
    for tx in biz_expenses:
        cat = tx.category.name if tx.category else "Uncategorized Expense"
        tx_exp = convert(tx.amount, tx.currency, target_curr)
        expense_by_category[cat] = expense_by_category.get(cat, Decimal("0.00")) + tx_exp

    operating_profit = net_revenue - total_biz_expenses
    margin = ((operating_profit / net_revenue) * Decimal("100.00")) if net_revenue > 0 else Decimal("0.00")

    return {
        "start_date": start_date,
        "end_date": end_date,
        "currency": target_curr,
        "gross_revenue": round_money(gross_revenue),
        "platform_fees": round_money(platform_fees),
        "net_revenue": round_money(net_revenue),
        "total_operating_expenses": round_money(total_biz_expenses),
        "operating_profit": round_money(operating_profit),
        "profit_margin_percentage": round_money(margin),
        "income_by_category": [{"category": k, "amount": round_money(v)} for k, v in income_by_category.items()],
        "expense_by_category": [{"category": k, "amount": round_money(v)} for k, v in expense_by_category.items()]
    }

@router.get("/invoice-aging")
def get_invoice_aging(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    today = date.today()
    invoices = db.query(Invoice).filter(
        Invoice.user_id == user_id,
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
    ).all()

    current_bucket = Decimal("0.00")      # Not yet due
    bucket_1_30 = Decimal("0.00")         # 1-30 days overdue
    bucket_31_60 = Decimal("0.00")        # 31-60 days overdue
    bucket_61_90 = Decimal("0.00")        # 61-90 days overdue
    bucket_90_plus = Decimal("0.00")      # 90+ days overdue

    detailed_invoices = []

    for inv in invoices:
        due = inv.due_date
        # inv.balance_due is integer cents — convert to display Decimal
        balance = from_cents(inv.balance_due)
        days_overdue = (today - due).days

        if days_overdue <= 0:
            current_bucket += balance
            aging_category = "Current"
        elif 1 <= days_overdue <= 30:
            bucket_1_30 += balance
            aging_category = "1-30 Days"
        elif 31 <= days_overdue <= 60:
            bucket_31_60 += balance
            aging_category = "31-60 Days"
        elif 61 <= days_overdue <= 90:
            bucket_61_90 += balance
            aging_category = "61-90 Days"
        else:
            bucket_90_plus += balance
            aging_category = "90+ Days"

        detailed_invoices.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "client_name": inv.client.name if inv.client else "Client",
            "due_date": inv.due_date,
            "days_overdue": max(0, days_overdue),
            "balance_due": round_money(balance),
            "currency": inv.currency,
            "category": aging_category
        })

    total_outstanding = current_bucket + bucket_1_30 + bucket_31_60 + bucket_61_90 + bucket_90_plus

    return {
        "summary": {
            "current": round_money(current_bucket),
            "overdue_1_30": round_money(bucket_1_30),
            "overdue_31_60": round_money(bucket_31_60),
            "overdue_61_90": round_money(bucket_61_90),
            "overdue_90_plus": round_money(bucket_90_plus),
            "total_outstanding": round_money(total_outstanding)
        },
        "invoices": detailed_invoices
    }

@router.get("/export/pdf")
def export_financial_report_pdf(
    start_date: date,
    end_date: date,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    freelancer_name = profile.full_name if profile and profile.full_name else "Independent Freelancer"
    curr = profile.base_currency if profile else "USD"

    pnl = get_profit_and_loss(start_date=start_date, end_date=end_date, user_id=user_id, db=db)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#0f172a'))
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#64748b'))
    section_style = ParagraphStyle('Sec', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1e293b'), spaceAfter=8)
    normal_style = ParagraphStyle('Norm', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#334155'))
    bold_style = ParagraphStyle('Bold', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#0f172a'), fontName='Helvetica-Bold')

    story = [
        Paragraph(f"<b>Financial Statement (Profit &amp; Loss)</b>", title_style),
        Paragraph(f"Prepared for: {freelancer_name} | Period: {start_date} to {end_date} | Currency: {curr}", subtitle_style),
        Spacer(1, 15),
        Paragraph("<b>Executive Summary</b>", section_style),
    ]

    summary_table_data = [
        [Paragraph("<b>Metric</b>", bold_style), Paragraph(f"<b>Amount ({curr})</b>", bold_style)],
        [Paragraph("Gross Revenue", normal_style), Paragraph(f"{pnl['gross_revenue']:.2f}", normal_style)],
        [Paragraph("Platform &amp; Processing Fees", normal_style), Paragraph(f"- {pnl['platform_fees']:.2f}", normal_style)],
        [Paragraph("<b>Net Received Revenue</b>", bold_style), Paragraph(f"<b>{pnl['net_revenue']:.2f}</b>", bold_style)],
        [Paragraph("Total Operating Expenses", normal_style), Paragraph(f"- {pnl['total_operating_expenses']:.2f}", normal_style)],
        [Paragraph("<b>Net Operating Profit</b>", bold_style), Paragraph(f"<b>{pnl['operating_profit']:.2f}</b>", bold_style)],
        [Paragraph("Profit Margin", normal_style), Paragraph(f"{pnl['profit_margin_percentage']:.2f}%", normal_style)],
    ]
    t_summary = Table(summary_table_data, colWidths=[350, 190])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('LINEBELOW', (0, 3), (-1, 3), 1, colors.HexColor('#94a3b8')),
        ('LINEBELOW', (0, 5), (-1, 5), 1.5, colors.HexColor('#4f46e5')),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 20))

    # Expense Breakdown Table
    story.append(Paragraph("<b>Operating Expense Breakdown</b>", section_style))
    exp_table_data = [[Paragraph("<b>Category</b>", bold_style), Paragraph(f"<b>Amount ({curr})</b>", bold_style)]]
    for row in pnl['expense_by_category']:
        exp_table_data.append([
            Paragraph(row['category'], normal_style),
            Paragraph(f"{row['amount']:.2f}", normal_style)
        ])
    if len(exp_table_data) == 1:
        exp_table_data.append([Paragraph("No expenses recorded in this period", normal_style), Paragraph("0.00", normal_style)])

    t_exp = Table(exp_table_data, colWidths=[350, 190])
    t_exp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(t_exp)

    doc.build(story)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ProfitLoss_{start_date}_to_{end_date}.pdf"}
    )
