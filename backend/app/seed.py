import uuid
from decimal import Decimal
from datetime import date, timedelta
from backend.app.core.database import SessionLocal
from backend.app.models.models import (
    UserProfile, Account, AccountType, Category, Client, Project,
    Transaction, TransactionType, Invoice, InvoiceStatus, InvoiceItem,
    InvoicePayment, Budget, BudgetCategory, BudgetPeriod, Subscription,
    BillingFrequency, SavingsGoal, SavingsContribution
)
from backend.app.engine.calculations import FinancialEngine
from backend.app.api.v1.auth import seed_default_categories

def seed_demo_data(user_id: str = "demo-freelancer"):
    db = SessionLocal()
    try:
        # 1. Profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(
                user_id=user_id,
                full_name="Sarah Connor",
                email="sarah@independent.dev",
                base_currency="USD",
                fiscal_year_start=1,
                country="US",
                tax_reserve_rate=Decimal("25.00")
            )
            db.add(profile)
            db.commit()

        seed_default_categories(db, user_id)

        # 2. Accounts
        checking = db.query(Account).filter(Account.user_id == user_id, Account.name == "Mercury Business Checking").first()
        if not checking:
            checking = Account(
                user_id=user_id,
                name="Mercury Business Checking",
                account_type=AccountType.BANK,
                currency="USD",
                opening_balance=Decimal("4500.00"),
                current_balance=Decimal("4500.00")
            )
            db.add(checking)

        savings = db.query(Account).filter(Account.user_id == user_id, Account.name == "Tax & Emergency Reserve").first()
        if not savings:
            savings = Account(
                user_id=user_id,
                name="Tax & Emergency Reserve",
                account_type=AccountType.SAVINGS,
                currency="USD",
                opening_balance=Decimal("2500.00"),
                current_balance=Decimal("2500.00")
            )
            db.add(savings)
        db.commit()
        db.refresh(checking)
        db.refresh(savings)

        # 3. Clients
        client_a = db.query(Client).filter(Client.user_id == user_id, Client.name == "Apex Media").first()
        if not client_a:
            client_a = Client(
                user_id=user_id,
                name="Apex Media",
                company_name="Apex Media Global Inc.",
                email="billing@apexmedia.co",
                default_currency="USD",
                payment_terms="Net 30"
            )
            db.add(client_a)

        client_b = db.query(Client).filter(Client.user_id == user_id, Client.name == "Veritas Ventures").first()
        if not client_b:
            client_b = Client(
                user_id=user_id,
                name="Veritas Ventures",
                company_name="Veritas Capital Partners",
                email="accounts@veritas.vc",
                default_currency="USD",
                payment_terms="Net 15"
            )
            db.add(client_b)
        db.commit()
        db.refresh(client_a)
        db.refresh(client_b)

        # 4. Invoices & Payments
        inv = db.query(Invoice).filter(Invoice.user_id == user_id, Invoice.invoice_number == "INV-DEMO-001").first()
        if not inv:
            today = date.today()
            inv = Invoice(
                user_id=user_id,
                client_id=client_a.id,
                invoice_number="INV-DEMO-001",
                status=InvoiceStatus.PARTIALLY_PAID,
                issue_date=today - timedelta(days=15),
                due_date=today + timedelta(days=15),
                currency="USD",
                subtotal=Decimal("4000.00"),
                total_amount=Decimal("4000.00"),
                amount_paid=Decimal("2000.00"),
                balance_due=Decimal("2000.00"),
                notes="50% milestone completed"
            )
            db.add(inv)
            db.flush()

            db.add(InvoiceItem(invoice_id=inv.id, description="Frontend SPA Implementation", quantity=Decimal("1.0"), unit_price=Decimal("4000.00"), total_amount=Decimal("4000.00")))
            
            # Payment transaction
            tx_income = Transaction(
                user_id=user_id,
                type=TransactionType.INCOME,
                amount=Decimal("2000.00"),
                currency="USD",
                base_amount=Decimal("2000.00"),
                fee_amount=Decimal("58.00"),
                description="Payment for INV-DEMO-001",
                date=today - timedelta(days=5),
                destination_account_id=checking.id,
                client_id=client_a.id,
                is_business=True,
                status="CONFIRMED"
            )
            db.add(tx_income)
            db.flush()

            db.add(InvoicePayment(
                user_id=user_id,
                invoice_id=inv.id,
                amount=Decimal("2000.00"),
                fee_amount=Decimal("58.00"),
                payment_date=today - timedelta(days=5),
                account_id=checking.id,
                transaction_id=tx_income.id
            ))
            db.commit()

        # Recalculate balances
        FinancialEngine.recalculate_account_balance(db, checking.id)
        FinancialEngine.recalculate_account_balance(db, savings.id)
        print(f"Demo data successfully seeded for user '{user_id}'.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
