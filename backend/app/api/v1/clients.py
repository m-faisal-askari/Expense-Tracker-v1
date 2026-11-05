from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.models.models import Client, Project, Invoice, Transaction, TransactionType, InvoiceStatus
from backend.app.schemas.schemas import ClientCreate, ClientUpdate, ClientResponse
from backend.app.engine.calculations import to_decimal, round_money
from backend.app.engine.money import from_cents, convert

router = APIRouter(prefix="/clients", tags=["Clients"])

def enrich_client(client: Client, db: Session) -> dict:
    invoices = db.query(Invoice).filter(
        Invoice.client_id == client.id,
        Invoice.status != InvoiceStatus.CANCELLED
    ).all()

    # inv.total_amount and inv.amount_paid are integer cents
    total_invoiced = sum((from_cents(inv.total_amount) for inv in invoices), Decimal("0.00"))
    total_received = sum((from_cents(inv.amount_paid) for inv in invoices), Decimal("0.00"))
    outstanding = max(Decimal("0.00"), total_invoiced - total_received)

    expenses = db.query(Transaction).filter(
        Transaction.client_id == client.id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.status == "CONFIRMED"
    ).all()
    # tx.amount is integer cents
    total_expenses = sum((from_cents(tx.amount) for tx in expenses), Decimal("0.00"))
    net_profit = total_received - total_expenses

    return {
        "id": client.id,
        "user_id": client.user_id,
        "name": client.name,
        "company_name": client.company_name,
        "email": client.email,
        "phone": client.phone,
        "billing_address": client.billing_address,
        "country": client.country,
        "default_currency": client.default_currency,
        "payment_terms": client.payment_terms,
        "notes": client.notes,
        "status": client.status,
        "created_at": client.created_at,
        "updated_at": client.updated_at,
        "total_invoiced": round_money(total_invoiced),
        "total_received": round_money(total_received),
        "outstanding_balance": round_money(outstanding),
        "total_expenses": round_money(total_expenses),
        "net_profit": round_money(net_profit),
    }

@router.get("", response_model=List[dict])
def get_clients(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    clients = db.query(Client).filter(Client.user_id == user_id).order_by(Client.name.asc()).all()
    return [enrich_client(c, db) for c in clients]

@router.get("/{client_id}", response_model=dict)
def get_client(client_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return enrich_client(client, db)

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_client(data: ClientCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    client = Client(
        user_id=user_id,
        name=data.name,
        company_name=data.company_name,
        email=data.email,
        phone=data.phone,
        billing_address=data.billing_address,
        country=data.country,
        default_currency=data.default_currency.upper(),
        payment_terms=data.payment_terms,
        notes=data.notes,
        status=data.status
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return enrich_client(client, db)

@router.put("/{client_id}", response_model=dict)
def update_client(client_id: str, data: ClientUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    
    for k, v in data.dict(exclude_unset=True).items():
        setattr(client, k, v)
        
    db.commit()
    db.refresh(client)
    return enrich_client(client, db)

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    
    # Check if has invoices
    has_inv = db.query(Invoice).filter(Invoice.client_id == client_id).first()
    if has_inv:
        client.status = "ARCHIVED"
        db.commit()
        return
        
    db.delete(client)
    db.commit()
    return None
