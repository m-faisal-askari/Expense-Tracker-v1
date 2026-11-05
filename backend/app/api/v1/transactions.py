import io
import csv
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import Transaction, TransactionType, Account, Category, Client, Project, UserProfile
from backend.app.schemas.schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from backend.app.engine.calculations import FinancialEngine, to_decimal
from backend.app.engine.money import to_cents, from_cents, convert

router = APIRouter(prefix="/transactions", tags=["Transactions"])

def enrich_transaction_response(tx: Transaction) -> dict:
    """Convert transaction with cents amounts to API-friendly dict."""
    return {
        "id": tx.id,
        "user_id": tx.user_id,
        "type": tx.type,
        "amount": from_cents(tx.amount),
        "currency": tx.currency,
        "fee_amount": from_cents(tx.fee_amount),
        "description": tx.description,
        "date": tx.date,
        "source_account_id": tx.source_account_id,
        "destination_account_id": tx.destination_account_id,
        "category_id": tx.category_id,
        "client_id": tx.client_id,
        "project_id": tx.project_id,
        "is_business": tx.is_business,
        "is_tax_deductible": tx.is_tax_deductible,
        "payment_method": tx.payment_method,
        "status": tx.status,
        "notes": tx.notes,
        "receipt_url": tx.receipt_url,
        "created_at": tx.created_at,
        "updated_at": tx.updated_at,
        "category_name": tx.category.name if tx.category else None,
        "account_name": (tx.destination_account.name if tx.destination_account else (tx.source_account.name if tx.source_account else None)),
        "client_name": tx.client.name if tx.client else None,
        "project_name": tx.project.name if tx.project else None,
    }

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    account_id: Optional[str] = None,
    client_id: Optional[str] = None,
    project_id: Optional[str] = None,
    is_business: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if type:
        query = query.filter(Transaction.type == type.upper())
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if client_id:
        query = query.filter(Transaction.client_id == client_id)
    if project_id:
        query = query.filter(Transaction.project_id == project_id)
    if is_business is not None:
        query = query.filter(Transaction.is_business == is_business)
    if account_id:
        query = query.filter(
            or_(
                Transaction.source_account_id == account_id,
                Transaction.destination_account_id == account_id
            )
        )
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_fmt),
                Transaction.notes.ilike(search_fmt)
            )
        )

    txs = query.order_by(Transaction.date.desc(), Transaction.created_at.desc()).offset(offset).limit(limit).all()
    return [enrich_transaction_response(t) for t in txs]

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Convert display amounts to integer cents
    amount = to_cents(data.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transaction amount must be strictly greater than zero.")
    
    fee_amount = to_cents(data.fee_amount)

    # Validate accounts based on type
    if data.type == TransactionType.INCOME:
        if not data.destination_account_id and not data.source_account_id:
            # Pick primary account if available
            first_acc = db.query(Account).filter(Account.user_id == user_id, Account.is_archived == False).first()
            if first_acc:
                data.destination_account_id = first_acc.id
        elif data.source_account_id and not data.destination_account_id:
            data.destination_account_id = data.source_account_id

    elif data.type == TransactionType.EXPENSE:
        if not data.source_account_id and not data.destination_account_id:
            first_acc = db.query(Account).filter(Account.user_id == user_id, Account.is_archived == False).first()
            if first_acc:
                data.source_account_id = first_acc.id
        elif data.destination_account_id and not data.source_account_id:
            data.source_account_id = data.destination_account_id

    elif data.type == TransactionType.TRANSFER:
        if not data.source_account_id or not data.destination_account_id:
            raise HTTPException(status_code=400, detail="Transfer requires both source and destination accounts.")
        if data.source_account_id == data.destination_account_id:
            raise HTTPException(status_code=400, detail="Source and destination accounts must be different.")

    tx = Transaction(
        user_id=user_id,
        type=data.type,
        amount=amount,
        currency=data.currency.upper(),
        fee_amount=fee_amount,
        description=data.description,
        date=data.date,
        source_account_id=data.source_account_id,
        destination_account_id=data.destination_account_id,
        category_id=data.category_id,
        client_id=data.client_id,
        project_id=data.project_id,
        is_business=data.is_business,
        is_tax_deductible=data.is_tax_deductible,
        payment_method=data.payment_method,
        status=data.status,
        notes=data.notes,
        receipt_url=data.receipt_url
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Recalculate affected account balances
    if tx.source_account_id:
        FinancialEngine.recalculate_account_balance(db, tx.source_account_id)
    if tx.destination_account_id:
        FinancialEngine.recalculate_account_balance(db, tx.destination_account_id)

    return enrich_transaction_response(tx)

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: str,
    data: TransactionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == user_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    old_source = tx.source_account_id
    old_dest = tx.destination_account_id

    update_dict = data.dict(exclude_unset=True)
    for k, v in update_dict.items():
        if k == "amount" and v is not None:
            v = to_cents(v)
        elif k == "fee_amount" and v is not None:
            v = to_cents(v)
        elif k == "currency" and v is not None:
            v = v.upper()
        setattr(tx, k, v)

    db.commit()
    db.refresh(tx)

    # Recalculate affected balances
    affected_accounts = {old_source, old_dest, tx.source_account_id, tx.destination_account_id}
    for acc_id in affected_accounts:
        if acc_id:
            FinancialEngine.recalculate_account_balance(db, acc_id)

    return enrich_transaction_response(tx)

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == user_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    source_id = tx.source_account_id
    dest_id = tx.destination_account_id

    db.delete(tx)
    db.commit()

    if source_id:
        FinancialEngine.recalculate_account_balance(db, source_id)
    if dest_id:
        FinancialEngine.recalculate_account_balance(db, dest_id)

    return None

@router.get("/export/csv")
def export_transactions_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if type:
        query = query.filter(Transaction.type == type.upper())

    transactions = query.order_by(Transaction.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Date", "Type", "Description", "Amount", 
        "Currency", "Fee", "Category", "Account", 
        "Client", "Project", "Classification", "Tax Deductible", "Status"
    ])

    for t in transactions:
        cat_name = t.category.name if t.category else ""
        acc_name = t.destination_account.name if t.destination_account else (t.source_account.name if t.source_account else "")
        client_name = t.client.name if t.client else ""
        proj_name = t.project.name if t.project else ""

        writer.writerow([
            t.id,
            t.date.isoformat(),
            t.type.value,
            t.description,
            f"{from_cents(t.amount):.2f}",
            t.currency,
            f"{from_cents(t.fee_amount):.2f}",
            cat_name,
            acc_name,
            client_name,
            proj_name,
            "Business" if t.is_business else "Personal",
            "Yes" if t.is_tax_deductible else "No",
            t.status
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{date.today().isoformat()}.csv"}
    )

@router.post("/import/csv")
async def import_transactions_csv(
    file: UploadFile = File(...),
    account_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    text = contents.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    base_currency = profile.base_currency if profile else "USD"

    default_account = None
    if account_id:
        default_account = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not default_account:
        default_account = db.query(Account).filter(Account.user_id == user_id, Account.is_archived == False).first()

    imported_count = 0
    errors = []

    for idx, row in enumerate(reader, start=1):
        try:
            # Map common headers flexibly
            raw_date = row.get("Date") or row.get("date") or row.get("Transaction Date")
            raw_desc = row.get("Description") or row.get("description") or row.get("Memo") or "Imported Transaction"
            raw_amt = row.get("Amount") or row.get("amount") or "0"
            raw_type = (row.get("Type") or row.get("type") or "EXPENSE").upper()
            raw_curr = (row.get("Currency") or row.get("currency") or base_currency).upper()

            tx_date = datetime.strptime(raw_date.strip(), "%Y-%m-%d").date() if raw_date else date.today()
            amount = abs(to_decimal(raw_amt.strip()))
            if amount <= 0:
                continue

            tx_type = TransactionType.INCOME if "INCOME" in raw_type else (TransactionType.TRANSFER if "TRANSFER" in raw_type else TransactionType.EXPENSE)
            amount_cents = to_cents(amount)

            dest_acc = default_account.id if (default_account and tx_type == TransactionType.INCOME) else None
            src_acc = default_account.id if (default_account and tx_type == TransactionType.EXPENSE) else None

            tx = Transaction(
                user_id=user_id,
                type=tx_type,
                amount=amount_cents,
                currency=raw_curr,
                fee_amount=0,
                description=raw_desc.strip(),
                date=tx_date,
                source_account_id=src_acc,
                destination_account_id=dest_acc,
                is_business=True,
                is_tax_deductible=True,
                status="CONFIRMED"
            )
            db.add(tx)
            imported_count += 1
        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")

    db.commit()

    if default_account:
        FinancialEngine.recalculate_account_balance(db, default_account.id)

    return {
        "imported_count": imported_count,
        "failed_count": len(errors),
        "errors": errors[:10] # Show first 10 errors if any
    }
