from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import Account, Transaction
from backend.app.schemas.schemas import AccountCreate, AccountUpdate, AccountResponse
from backend.app.engine.calculations import FinancialEngine, to_decimal
from backend.app.engine.money import to_cents, from_cents

router = APIRouter(prefix="/accounts", tags=["Financial Accounts"])

def enrich_account_response(acc: Account) -> dict:
    """Convert account with cents amounts to API-friendly dict."""
    return {
        "id": acc.id,
        "user_id": acc.user_id,
        "name": acc.name,
        "account_type": acc.account_type,
        "currency": acc.currency,
        "opening_balance": from_cents(acc.opening_balance),
        "opening_balance_date": acc.opening_balance_date,
        "current_balance": from_cents(acc.current_balance),
        "is_archived": acc.is_archived,
        "notes": acc.notes,
        "created_at": acc.created_at,
        "updated_at": acc.updated_at,
    }

@router.get("", response_model=List[AccountResponse])
def get_accounts(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.user_id == user_id).order_by(Account.created_at.asc()).all()
    # Recalculate balance to ensure consistency
    for acc in accounts:
        FinancialEngine.recalculate_account_balance(db, acc.id)
    return [enrich_account_response(acc) for acc in accounts]

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(data: AccountCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    opening_bal = to_cents(data.opening_balance)
    account = Account(
        user_id=user_id,
        name=data.name,
        account_type=data.account_type,
        currency=data.currency.upper(),
        opening_balance=opening_bal,
        opening_balance_date=data.opening_balance_date,
        current_balance=opening_bal,
        notes=data.notes
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return enrich_account_response(account)

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: str, data: AccountUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    
    for key, value in data.dict(exclude_unset=True).items():
        if key == "opening_balance" and value is not None:
            value = to_cents(value)
        setattr(account, key, value)
        
    db.commit()
    db.refresh(account)
    FinancialEngine.recalculate_account_balance(db, account.id)
    return enrich_account_response(account)

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    
    # Check if there are transactions associated
    has_tx = db.query(Transaction).filter(
        (Transaction.source_account_id == account_id) | (Transaction.destination_account_id == account_id)
    ).first()
    if has_tx:
        # Soft-archive instead of hard-delete to maintain accounting integrity
        account.is_archived = True
        db.commit()
        return
        
    db.delete(account)
    db.commit()
    return None
