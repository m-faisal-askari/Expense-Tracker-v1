from typing import List
from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import Subscription, BillingFrequency, Transaction, TransactionType, UserProfile
from backend.app.schemas.schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse
from backend.app.engine.calculations import to_decimal, round_money, FinancialEngine
from backend.app.engine.money import to_cents, from_cents

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

def advance_next_date(current_date: date, frequency: BillingFrequency) -> date:
    if frequency == BillingFrequency.WEEKLY:
        return current_date + timedelta(days=7)
    elif frequency == BillingFrequency.MONTHLY:
        # Simple monthly advance
        month = current_date.month + 1
        year = current_date.year
        if month > 12:
            month = 1
            year += 1
        return date(year, month, min(current_date.day, 28))
    elif frequency == BillingFrequency.QUARTERLY:
        month = current_date.month + 3
        year = current_date.year
        if month > 12:
            month -= 12
            year += 1
        return date(year, month, min(current_date.day, 28))
    elif frequency == BillingFrequency.SEMI_ANNUALLY:
        month = current_date.month + 6
        year = current_date.year
        if month > 12:
            month -= 12
            year += 1
        return date(year, month, min(current_date.day, 28))
    elif frequency == BillingFrequency.ANNUALLY:
        return date(current_date.year + 1, current_date.month, min(current_date.day, 28))
    return current_date + timedelta(days=30)

def enrich_subscription_response(sub: Subscription) -> dict:
    """Convert subscription with cents amounts to API-friendly dict."""
    return {
        "id": sub.id,
        "user_id": sub.user_id,
        "name": sub.name,
        "vendor": sub.vendor,
        "amount": from_cents(sub.amount),
        "currency": sub.currency,
        "billing_frequency": sub.billing_frequency,
        "next_payment_date": sub.next_payment_date,
        "account_id": sub.account_id,
        "category_id": sub.category_id,
        "is_active": sub.is_active,
        "notes": sub.notes,
        "created_at": sub.created_at,
    }

@router.get("", response_model=List[SubscriptionResponse])
def get_subscriptions(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    subs = db.query(Subscription).filter(Subscription.user_id == user_id).order_by(Subscription.next_payment_date.asc()).all()
    return [enrich_subscription_response(s) for s in subs]

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(data: SubscriptionCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    sub = Subscription(
        user_id=user_id,
        name=data.name,
        vendor=data.vendor,
        amount=to_cents(data.amount),
        currency=data.currency.upper(),
        billing_frequency=data.billing_frequency,
        next_payment_date=data.next_payment_date,
        account_id=data.account_id,
        category_id=data.category_id,
        is_active=True,
        notes=data.notes
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return enrich_subscription_response(sub)

@router.put("/{sub_id}", response_model=SubscriptionResponse)
def update_subscription(sub_id: str, data: SubscriptionUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    for k, v in data.dict(exclude_unset=True).items():
        if k == "amount" and v is not None:
            sub.amount = to_cents(v)
        elif k == "currency" and v is not None:
            sub.currency = v.upper()
        elif v is not None:
            setattr(sub, k, v)

    db.commit()
    db.refresh(sub)
    return enrich_subscription_response(sub)

@router.post("/{sub_id}/confirm-payment")
def confirm_subscription_payment(sub_id: str, payment_date: date = date.today(), user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    # Create confirmed expense transaction — sub.amount is already integer cents
    tx = Transaction(
        user_id=user_id,
        type=TransactionType.EXPENSE,
        amount=sub.amount,
        currency=sub.currency,
        fee_amount=0,
        description=f"Subscription: {sub.name}",
        date=payment_date,
        source_account_id=sub.account_id,
        category_id=sub.category_id,
        is_business=True,
        is_tax_deductible=True,
        status="CONFIRMED",
        notes=f"Recurring payment for {sub.name}"
    )
    db.add(tx)

    # Advance next payment date
    sub.next_payment_date = advance_next_date(sub.next_payment_date, sub.billing_frequency)
    db.commit()

    if sub.account_id:
        FinancialEngine.recalculate_account_balance(db, sub.account_id)

    return {"message": "Payment confirmed and next due date updated.", "next_payment_date": sub.next_payment_date}

@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(sub_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
    db.delete(sub)
    db.commit()
    return None
