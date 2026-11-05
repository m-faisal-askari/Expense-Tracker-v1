from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import (
    TaxProfile, TaxPayment, Transaction, TransactionType, UserProfile, Account
)
from backend.app.schemas.schemas import TaxProfileCreate, TaxPaymentCreate
from backend.app.engine.calculations import to_decimal, round_money, FinancialEngine
from backend.app.engine.money import to_cents, from_cents, convert

router = APIRouter(prefix="/taxes", tags=["Taxes"])

@router.get("/summary")
def get_tax_summary(
    tax_year: Optional[int] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    year = tax_year or date.today().year
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    reserve_rate = profile.tax_reserve_rate if profile else Decimal("25.00")

    # Business Income — tx.amount and tx.fee_amount are integer cents
    income_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.INCOME,
        Transaction.is_business == True,
        Transaction.status == "CONFIRMED",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    business_gross = sum((from_cents(tx.amount) for tx in income_txs), Decimal("0.00"))
    business_fees = sum((from_cents(tx.fee_amount) for tx in income_txs), Decimal("0.00"))
    business_net_income = business_gross - business_fees

    # Deductible Business Expenses
    deductible_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.is_business == True,
        Transaction.is_tax_deductible == True,
        Transaction.status == "CONFIRMED",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    deductible_expenses = sum((from_cents(tx.amount) for tx in deductible_txs), Decimal("0.00"))

    taxable_net_income = max(Decimal("0.00"), business_net_income - deductible_expenses)
    estimated_tax_liability = (taxable_net_income * (reserve_rate / Decimal("100.00"))).quantize(Decimal("0.01"))

    # Tax payments already made this year — p.amount is integer cents
    tax_payments = db.query(TaxPayment).filter(
        TaxPayment.user_id == user_id,
        TaxPayment.tax_year == year
    ).all()
    payments_made = sum((from_cents(p.amount) for p in tax_payments), Decimal("0.00"))

    remaining_tax_reserve = max(Decimal("0.00"), estimated_tax_liability - payments_made)

    return {
        "tax_year": year,
        "tax_reserve_rate": round_money(reserve_rate),
        "business_gross_income": round_money(business_gross),
        "platform_fees_deducted": round_money(business_fees),
        "business_net_income": round_money(business_net_income),
        "deductible_business_expenses": round_money(deductible_expenses),
        "estimated_taxable_income": round_money(taxable_net_income),
        "estimated_tax_liability": round_money(estimated_tax_liability),
        "tax_payments_made": round_money(payments_made),
        "remaining_tax_reserve_target": round_money(remaining_tax_reserve),
        "disclaimer": "Estimates are for planning purposes and do not constitute official tax advice."
    }

@router.get("/payments", response_model=List[dict])
def get_tax_payments(
    tax_year: Optional[int] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(TaxPayment).filter(TaxPayment.user_id == user_id)
    if tax_year:
        query = query.filter(TaxPayment.tax_year == tax_year)
    payments = query.order_by(TaxPayment.payment_date.desc()).all()
    return [
        {
            "id": p.id,
            "amount": from_cents(p.amount),
            "currency": p.currency,
            "payment_date": p.payment_date,
            "tax_year": p.tax_year,
            "notes": p.notes,
            "created_at": p.created_at
        }
        for p in payments
    ]

@router.post("/payments", status_code=status.HTTP_201_CREATED)
def record_tax_payment(
    data: TaxPaymentCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    amt_cents = to_cents(data.amount)
    payment = TaxPayment(
        user_id=user_id,
        amount=amt_cents,
        currency=data.currency.upper(),
        payment_date=data.payment_date,
        tax_year=data.tax_year,
        account_id=data.account_id,
        notes=data.notes
    )
    db.add(payment)

    # Also record an expense transaction if an account was specified
    if data.account_id:
        tx = Transaction(
            user_id=user_id,
            type=TransactionType.EXPENSE,
            amount=amt_cents,
            currency=data.currency.upper(),
            fee_amount=0,
            description=f"Tax Payment ({data.tax_year})",
            date=data.payment_date,
            source_account_id=data.account_id,
            is_business=True,
            is_tax_deductible=False,
            status="CONFIRMED",
            notes=f"Tax payment for tax year {data.tax_year}"
        )
        db.add(tx)

    db.commit()

    if data.account_id:
        FinancialEngine.recalculate_account_balance(db, data.account_id)

    return {"message": "Tax payment recorded successfully.", "id": payment.id}
