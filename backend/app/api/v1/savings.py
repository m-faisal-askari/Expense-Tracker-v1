from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import SavingsGoal, SavingsContribution, Transaction, TransactionType
from backend.app.schemas.schemas import SavingsGoalCreate, SavingsGoalUpdate, SavingsContributionCreate
from backend.app.engine.calculations import to_decimal, round_money, FinancialEngine
from backend.app.engine.money import to_cents, from_cents

router = APIRouter(prefix="/savings", tags=["Savings Goals"])

def enrich_goal(goal: SavingsGoal) -> dict:
    # target_amount and current_amount are integer cents
    target = from_cents(goal.target_amount)
    current = from_cents(goal.current_amount)
    pct = ((current / target) * Decimal("100.00")) if target > 0 else Decimal("0.00")
    
    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "name": goal.name,
        "target_amount": round_money(target),
        "currency": goal.currency,
        "current_amount": round_money(current),
        "progress_percentage": round_money(min(Decimal("100.00"), pct)),
        "target_date": goal.target_date,
        "is_completed": current >= target,
        "notes": goal.notes,
        "created_at": goal.created_at,
        "contributions": [
            {
                "id": c.id,
                "amount": from_cents(c.amount),
                "contribution_date": c.contribution_date,
                "notes": c.notes,
                "created_at": c.created_at
            }
            for c in goal.contributions
        ]
    }

@router.get("", response_model=List[dict])
def get_savings_goals(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).order_by(SavingsGoal.created_at.desc()).all()
    return [enrich_goal(g) for g in goals]

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_savings_goal(data: SavingsGoalCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    goal = SavingsGoal(
        user_id=user_id,
        name=data.name,
        target_amount=to_cents(data.target_amount),
        currency=data.currency.upper(),
        current_amount=0,
        target_date=data.target_date,
        notes=data.notes
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)

@router.post("/{goal_id}/contribute", response_model=dict)
def contribute_to_goal(
    goal_id: str,
    data: SavingsContributionCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    amt = to_cents(data.amount)
    if amt <= 0:
        raise HTTPException(status_code=400, detail="Contribution amount must be greater than zero.")

    contrib = SavingsContribution(
        savings_goal_id=goal.id,
        user_id=user_id,
        amount=amt,
        contribution_date=data.contribution_date,
        account_id=data.account_id,
        notes=data.notes
    )
    db.add(contrib)

    # Update goal current_amount (integer cents arithmetic)
    goal.current_amount = (goal.current_amount or 0) + amt
    if goal.current_amount >= (goal.target_amount or 0):
        goal.is_completed = True

    # Optionally record transfer/outflow from account
    if data.account_id:
        tx = Transaction(
            user_id=user_id,
            type=TransactionType.EXPENSE,
            amount=amt,
            currency=goal.currency,
            fee_amount=0,
            description=f"Savings Contribution: {goal.name}",
            date=data.contribution_date,
            source_account_id=data.account_id,
            is_business=False,
            is_tax_deductible=False,
            status="CONFIRMED",
            notes=f"Contributed to goal: {goal.name}"
        )
        db.add(tx)

    db.commit()
    db.refresh(goal)

    if data.account_id:
        FinancialEngine.recalculate_account_balance(db, data.account_id)

    return enrich_goal(goal)

@router.put("/{goal_id}", response_model=dict)
def update_savings_goal(goal_id: str, data: SavingsGoalUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    for k, v in data.dict(exclude_unset=True).items():
        if k == "target_amount" and v is not None:
            goal.target_amount = to_cents(v)
        elif k == "currency" and v is not None:
            goal.currency = v.upper()
        elif v is not None:
            setattr(goal, k, v)

    db.commit()
    db.refresh(goal)
    return enrich_goal(goal)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(goal_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")
    db.delete(goal)
    db.commit()
    return None
