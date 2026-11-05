from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import (
    Transaction, TransactionType, Account, Invoice, InvoiceStatus, 
    Subscription, UserProfile, Category
)
from backend.app.engine.calculations import FinancialEngine, to_decimal, round_money
from backend.app.engine.money import from_cents, convert

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    period: str = Query("this_month", pattern="^(this_month|last_month|last_3_months|last_6_months|this_year|last_year|custom)$"),
    currency: Optional[str] = Query(None),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    today = date.today()

    if period == "this_month":
        s_date = date(today.year, today.month, 1)
        # End of current month
        if today.month == 12:
            e_date = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            e_date = date(today.year, today.month + 1, 1) - timedelta(days=1)
    elif period == "last_month":
        first_current = date(today.year, today.month, 1)
        e_date = first_current - timedelta(days=1)
        s_date = date(e_date.year, e_date.month, 1)
    elif period == "last_3_months":
        s_date = today - timedelta(days=90)
        e_date = today
    elif period == "last_6_months":
        s_date = today - timedelta(days=180)
        e_date = today
    elif period == "this_year":
        s_date = date(today.year, 1, 1)
        e_date = date(today.year, 12, 31)
    elif period == "last_year":
        s_date = date(today.year - 1, 1, 1)
        e_date = date(today.year - 1, 12, 31)
    elif period == "custom" and start_date and end_date:
        s_date = start_date
        e_date = end_date
    else:
        s_date = date(today.year, today.month, 1)
        e_date = today

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    tax_rate = profile.tax_reserve_rate if profile else Decimal("25.00")
    target_currency = currency.upper() if currency else (profile.base_currency if profile else "PKR")

    metrics = FinancialEngine.calculate_dashboard_metrics(
        db=db,
        user_id=user_id,
        start_date=s_date,
        end_date=e_date,
        tax_reserve_rate=tax_rate,
        target_currency=target_currency
    )
    return metrics

@router.get("/charts")
def get_dashboard_charts(
    months: int = Query(6, ge=3, le=12),
    currency: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Returns monthly income vs expenses trends and category breakdown in target currency.
    """
    today = date.today()
    monthly_data = []

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    target_currency = currency.upper() if currency else (profile.base_currency if profile else "PKR")

    # Calculate last N months
    for i in range(months - 1, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1

        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        m_metrics = FinancialEngine.calculate_dashboard_metrics(
            db=db, user_id=user_id, start_date=first_day, end_date=last_day, target_currency=target_currency
        )

        month_name = first_day.strftime("%b %Y")
        monthly_data.append({
            "month": month_name,
            "income": float(m_metrics["net_received_income"]),
            "expenses": float(m_metrics["total_expenses"]),
            "profit": float(m_metrics["business_profit"]),
            "net_cash_flow": float(m_metrics["net_cash_flow"]),
        })

    # Category breakdown for expenses in the last 30 days
    thirty_days_ago = today - timedelta(days=30)
    expense_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.status == "CONFIRMED",
        Transaction.date >= thirty_days_ago
    ).all()

    category_map: Dict[str, Decimal] = {}
    for tx in expense_txs:
        cat_name = tx.category.name if tx.category else "Uncategorized"
        # tx.amount is integer cents — convert() returns display Decimal in target currency
        amt_converted = convert(tx.amount, tx.currency, target_currency)
        category_map[cat_name] = category_map.get(cat_name, Decimal("0.00")) + amt_converted

    category_distribution = [
        {"name": k, "value": float(round_money(v))}
        for k, v in sorted(category_map.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "monthly_trends": monthly_data,
        "category_distribution": category_distribution
    }

@router.get("/upcoming")
def get_upcoming_obligations(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Returns upcoming invoices due and upcoming subscription renewals.
    """
    today = date.today()
    future_limit = today + timedelta(days=30)

    # Invoices due soon
    due_invoices = db.query(Invoice).filter(
        Invoice.user_id == user_id,
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
        Invoice.due_date <= future_limit
    ).order_by(Invoice.due_date.asc()).limit(5).all()

    invoices_list = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "client_name": inv.client.name if inv.client else "Client",
            "amount": float(from_cents(inv.balance_due)),
            "currency": inv.currency,
            "due_date": inv.due_date.isoformat(),
            "status": inv.status.value,
            "is_overdue": inv.due_date < today
        }
        for inv in due_invoices
    ]

    # Subscriptions renewing soon
    active_subs = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.is_active == True,
        Subscription.next_payment_date <= future_limit
    ).order_by(Subscription.next_payment_date.asc()).limit(5).all()

    subs_list = [
        {
            "id": sub.id,
            "name": sub.name,
            "vendor": sub.vendor,
            "amount": float(from_cents(sub.amount)),
            "currency": sub.currency,
            "frequency": sub.billing_frequency.value,
            "next_date": sub.next_payment_date.isoformat()
        }
        for sub in active_subs
    ]

    return {
        "upcoming_invoices": invoices_list,
        "upcoming_subscriptions": subs_list
    }
