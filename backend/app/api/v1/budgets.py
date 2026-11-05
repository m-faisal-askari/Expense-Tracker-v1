from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import Budget, BudgetCategory, Transaction, TransactionType, Category
from backend.app.schemas.schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from backend.app.engine.calculations import to_decimal, round_money
from backend.app.engine.money import to_cents, from_cents, convert

router = APIRouter(prefix="/budgets", tags=["Budgets"])

def enrich_budget(budget: Budget, db: Session, target_currency: Optional[str] = None) -> dict:
    # Calculate actual spending for this budget's timeframe and categories
    cat_ids = [bc.category_id for bc in budget.categories]

    tx_query = db.query(Transaction).filter(
        Transaction.user_id == budget.user_id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.status == "CONFIRMED",
        Transaction.date >= budget.start_date,
        Transaction.date <= budget.end_date
    )
    if cat_ids:
        tx_query = tx_query.filter(Transaction.category_id.in_(cat_ids))

    expenses = tx_query.all()
    curr = (target_currency or budget.currency or "USD").upper()

    # tx.amount is integer cents — convert() returns display Decimal in target currency
    spent_amount = sum(
        (convert(tx.amount, tx.currency, curr) for tx in expenses),
        Decimal("0.00")
    )
    # budget.total_allocated is integer cents
    allocated = from_cents(budget.total_allocated)
    remaining = allocated - spent_amount

    utilization = ((spent_amount / allocated) * Decimal("100.00")) if allocated > 0 else Decimal("0.00")

    # Category breakdowns
    categories_detail = []
    for bc in budget.categories:
        c_spent = sum(
            (convert(tx.amount, tx.currency, curr) for tx in expenses if tx.category_id == bc.category_id),
            Decimal("0.00")
        )
        # bc.allocated_amount is integer cents
        c_alloc = from_cents(bc.allocated_amount)
        categories_detail.append({
            "category_id": bc.category_id,
            "category_name": bc.category.name if bc.category else "Unknown",
            "allocated_amount": round_money(c_alloc),
            "spent_amount": round_money(c_spent),
            "remaining_amount": round_money(c_alloc - c_spent),
            "utilization_percentage": round_money(((c_spent / c_alloc) * Decimal("100.00")) if c_alloc > 0 else Decimal("0.00"))
        })

    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "name": budget.name,
        "period": budget.period,
        "start_date": budget.start_date,
        "end_date": budget.end_date,
        "total_allocated": round_money(allocated),
        "spent_amount": round_money(spent_amount),
        "remaining_amount": round_money(remaining),
        "utilization_percentage": round_money(utilization),
        "is_rollover": budget.is_rollover,
        "currency": budget.currency,
        "categories": categories_detail,
        "created_at": budget.created_at
    }

@router.get("", response_model=List[dict])
def get_budgets(currency: Optional[str] = None, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    budgets = db.query(Budget).filter(Budget.user_id == user_id).order_by(Budget.start_date.desc()).all()
    return [enrich_budget(b, db, currency) for b in budgets]

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_budget(data: BudgetCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    budget = Budget(
        user_id=user_id,
        name=data.name,
        period=data.period,
        start_date=data.start_date,
        end_date=data.end_date,
        total_allocated=to_cents(data.total_allocated),
        currency=data.currency.upper() if data.currency else "USD",
        is_rollover=data.is_rollover
    )
    db.add(budget)
    db.flush()

    for item in data.categories:
        b_cat = BudgetCategory(
            budget_id=budget.id,
            category_id=item.category_id,
            allocated_amount=to_cents(item.allocated_amount)
        )
        db.add(b_cat)

    db.commit()
    db.refresh(budget)
    return enrich_budget(budget, db)

@router.put("/{budget_id}", response_model=dict)
def update_budget(budget_id: str, data: BudgetUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")

    for k, v in data.dict(exclude_unset=True).items():
        if k == "categories" and v is not None:
            db.query(BudgetCategory).filter(BudgetCategory.budget_id == budget.id).delete()
            for item in v:
                db.add(BudgetCategory(
                    budget_id=budget.id,
                    category_id=item["category_id"],
                    allocated_amount=to_cents(item["allocated_amount"])
                ))
        elif k == "total_allocated" and v is not None:
            budget.total_allocated = to_cents(v)
        elif k == "currency" and v is not None:
            budget.currency = v.upper()
        elif v is not None:
            setattr(budget, k, v)

    db.commit()
    db.refresh(budget)
    return enrich_budget(budget, db)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")
    db.delete(budget)
    db.commit()
    return None
