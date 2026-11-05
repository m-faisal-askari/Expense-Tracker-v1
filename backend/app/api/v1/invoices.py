from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import (
    Invoice, InvoiceItem, InvoicePayment, InvoiceStatus, Client, Project, 
    Transaction, TransactionType, Account, UserProfile
)
from backend.app.schemas.schemas import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoicePaymentCreate, InvoicePaymentResponse
)
from backend.app.engine.calculations import FinancialEngine, to_decimal, round_money
from backend.app.engine.money import to_cents, from_cents
from backend.app.utils.pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def enrich_invoice_response(inv: Invoice) -> dict:
    """Convert invoice with cents amounts to API-friendly dict."""
    return {
        "id": inv.id,
        "user_id": inv.user_id,
        "client_id": inv.client_id,
        "project_id": inv.project_id,
        "invoice_number": inv.invoice_number,
        "status": inv.status,
        "issue_date": inv.issue_date,
        "due_date": inv.due_date,
        "currency": inv.currency,
        "subtotal": from_cents(inv.subtotal),
        "discount_amount": from_cents(inv.discount_amount),
        "tax_rate": inv.tax_rate,
        "tax_amount": from_cents(inv.tax_amount),
        "total_amount": from_cents(inv.total_amount),
        "amount_paid": from_cents(inv.amount_paid),
        "balance_due": from_cents(inv.balance_due),
        "notes": inv.notes,
        "payment_instructions": inv.payment_instructions,
        "items": [
            {
                "id": it.id,
                "invoice_id": it.invoice_id,
                "description": it.description,
                "quantity": it.quantity,
                "unit_price": from_cents(it.unit_price),
                "total_amount": from_cents(it.total_amount)
            }
            for it in inv.items
        ],
        "payments": [
            {
                "id": p.id,
                "invoice_id": p.invoice_id,
                "amount": from_cents(p.amount),
                "fee_amount": from_cents(p.fee_amount),
                "payment_date": p.payment_date,
                "account_id": p.account_id,
                "transaction_id": p.transaction_id,
                "notes": p.notes,
                "created_at": p.created_at
            }
            for p in inv.payments
        ],
        "client_name": inv.client.name if inv.client else None,
        "client_company": inv.client.company_name if inv.client else None,
        "client_email": inv.client.email if inv.client else None,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at
    }

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(
    status: Optional[str] = None,
    client_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice).filter(Invoice.user_id == user_id)
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if status:
        query = query.filter(Invoice.status == status.upper())

    today = date.today()
    invoices = query.order_by(Invoice.issue_date.desc(), Invoice.created_at.desc()).all()

    # Automatically mark overdue if past due date and still unpaid
    for inv in invoices:
        if inv.status in (InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID) and inv.due_date < today:
            inv.status = InvoiceStatus.OVERDUE
            db.commit()

    return [enrich_invoice_response(inv) for inv in invoices]

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return enrich_invoice_response(inv)

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(data: InvoiceCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Check duplicate invoice number for this user
    existing = db.query(Invoice).filter(
        Invoice.user_id == user_id,
        Invoice.invoice_number == data.invoice_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Invoice number '{data.invoice_number}' already exists.")

    client = db.query(Client).filter(Client.id == data.client_id, Client.user_id == user_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Invalid client specified.")

    # calculate_invoice_totals works with display Decimals
    calc_totals = FinancialEngine.calculate_invoice_totals(
        items=[it.model_dump() for it in data.items],
        discount_amount=to_decimal(data.discount_amount),
        tax_rate_percent=to_decimal(data.tax_rate)
    )

    # Convert display Decimal totals to integer cents for storage
    inv = Invoice(
        user_id=user_id,
        client_id=data.client_id,
        project_id=data.project_id,
        invoice_number=data.invoice_number,
        status=InvoiceStatus.SENT,
        issue_date=data.issue_date,
        due_date=data.due_date,
        currency=data.currency.upper(),
        subtotal=to_cents(calc_totals["subtotal"]),
        discount_amount=to_cents(calc_totals["discount_amount"]),
        tax_rate=to_decimal(data.tax_rate),
        tax_amount=to_cents(calc_totals["tax_amount"]),
        total_amount=to_cents(calc_totals["total_amount"]),
        amount_paid=0,
        balance_due=to_cents(calc_totals["total_amount"]),
        notes=data.notes,
        payment_instructions=data.payment_instructions
    )
    db.add(inv)
    db.flush()

    # Add line items — unit_price stored as cents, quantity stays as Numeric
    for it in data.items:
        q = to_decimal(it.quantity)
        p = to_decimal(it.unit_price)
        item_total = (q * p).quantize(Decimal("0.01"))
        item_obj = InvoiceItem(
            invoice_id=inv.id,
            description=it.description,
            quantity=q,
            unit_price=to_cents(p),
            total_amount=to_cents(item_total)
        )
        db.add(item_obj)

    db.commit()
    db.refresh(inv)
    return enrich_invoice_response(inv)

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: str, data: InvoiceUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if data.client_id:
        inv.client_id = data.client_id
    if data.project_id is not None:
        inv.project_id = data.project_id
    if data.due_date:
        inv.due_date = data.due_date
    if data.currency:
        inv.currency = data.currency.upper()
    if data.notes is not None:
        inv.notes = data.notes
    if data.payment_instructions is not None:
        inv.payment_instructions = data.payment_instructions
    if data.discount_amount is not None:
        inv.discount_amount = to_cents(data.discount_amount)
    if data.tax_rate is not None:
        inv.tax_rate = to_decimal(data.tax_rate)

    if data.items is not None and len(data.items) > 0:
        # Replace items
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).delete()
        calc = FinancialEngine.calculate_invoice_totals(
            items=[it.model_dump() for it in data.items],
            discount_amount=from_cents(inv.discount_amount),
            tax_rate_percent=inv.tax_rate
        )
        inv.subtotal = to_cents(calc["subtotal"])
        inv.tax_amount = to_cents(calc["tax_amount"])
        inv.total_amount = to_cents(calc["total_amount"])
        inv.balance_due = max(0, inv.total_amount - (inv.amount_paid or 0))
        
        for it in data.items:
            q = to_decimal(it.quantity)
            p = to_decimal(it.unit_price)
            db.add(InvoiceItem(
                invoice_id=inv.id,
                description=it.description,
                quantity=q,
                unit_price=to_cents(p),
                total_amount=to_cents((q * p).quantize(Decimal("0.01")))
            ))

    db.commit()
    db.refresh(inv)
    return enrich_invoice_response(inv)

@router.post("/{invoice_id}/payments", response_model=InvoiceResponse)
def record_invoice_payment(
    invoice_id: str,
    data: InvoicePaymentCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if inv.status in (InvoiceStatus.PAID, InvoiceStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot record payment for an invoice with status '{inv.status.value}'.")

    # Convert payment amounts to integer cents
    pay_amount = to_cents(data.amount)
    fee_amount = to_cents(data.fee_amount)

    if pay_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")

    if pay_amount > (inv.balance_due or 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Payment amount ({from_cents(pay_amount)}) exceeds remaining balance due ({from_cents(inv.balance_due)})."
        )

    account = db.query(Account).filter(Account.id == data.account_id, Account.user_id == user_id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Selected account does not exist.")

    # 1. Create linked INCOME transaction (amounts in cents)
    tx = Transaction(
        user_id=user_id,
        type=TransactionType.INCOME,
        amount=pay_amount,
        currency=inv.currency,
        fee_amount=fee_amount,
        description=f"Payment received for Invoice #{inv.invoice_number}",
        date=data.payment_date,
        destination_account_id=account.id,
        client_id=inv.client_id,
        project_id=inv.project_id,
        is_business=True,
        is_tax_deductible=False,
        status="CONFIRMED",
        notes=f"Invoice #{inv.invoice_number} settlement"
    )
    db.add(tx)
    db.flush()

    # 2. Create InvoicePayment record (amounts in cents)
    payment_record = InvoicePayment(
        user_id=user_id,
        invoice_id=inv.id,
        amount=pay_amount,
        fee_amount=fee_amount,
        payment_date=data.payment_date,
        account_id=account.id,
        transaction_id=tx.id,
        notes=data.notes
    )
    db.add(payment_record)

    # 3. Update invoice amount_paid, balance_due, and status (integer cents arithmetic)
    new_paid = (inv.amount_paid or 0) + pay_amount
    new_balance = max(0, (inv.total_amount or 0) - new_paid)
    inv.amount_paid = new_paid
    inv.balance_due = new_balance

    if inv.balance_due <= 0:
        inv.status = InvoiceStatus.PAID
    else:
        inv.status = InvoiceStatus.PARTIALLY_PAID

    db.commit()
    db.refresh(inv)

    # 4. Recalculate account balance
    FinancialEngine.recalculate_account_balance(db, account.id)

    return enrich_invoice_response(inv)

@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(invoice_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if (inv.amount_paid or 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot cancel an invoice with recorded payments.")

    inv.status = InvoiceStatus.CANCELLED
    inv.balance_due = 0
    db.commit()
    db.refresh(inv)
    return enrich_invoice_response(inv)

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    db.delete(inv)
    db.commit()
    return None

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    client = inv.client
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    pdf_bytes = generate_invoice_pdf(inv, client, profile)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice_{inv.invoice_number}.pdf"}
    )
