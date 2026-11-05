import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.models import (
    Account, AccountType, Transaction, TransactionType, 
    UserProfile, Invoice, InvoiceStatus, InvoiceItem, InvoicePayment,
    Budget, BudgetCategory
)
from backend.app.engine.calculations import FinancialEngine, round_money
from backend.app.engine.money import to_cents, from_cents

# Create in-memory SQLite database for isolated tests
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_financial_acceptance_scenario(db_session):
    """
    Mandatory Acceptance Test Scenario from Specification:
    - Opening account balance: $1,000 across owned accounts.
    - Confirmed income: $2,000.
    - Confirmed expenses: $500.
    - Transfer between two owned accounts: $200.

    Expected results:
    - Income: $2,000.
    - Expenses: $500.
    - Net cash flow: +$1,500.
    - Consolidated account balance increase: +$1,500 (Total = $2,500).
    - The $200 transfer must NOT appear as income or expense.
    """
    user_id = "test-freelancer-1"

    # 1. Setup User Profile & Two Accounts
    db_session.add(UserProfile(user_id=user_id, base_currency="USD", tax_reserve_rate=Decimal("25.00")))

    # Account A: $800 opening balance (stored as cents)
    acc_a = Account(
        user_id=user_id,
        name="Main Checking",
        account_type=AccountType.BANK,
        currency="USD",
        opening_balance=to_cents("800.00"),
        current_balance=to_cents("800.00")
    )
    # Account B: $200 opening balance (Total opening = $1,000)
    acc_b = Account(
        user_id=user_id,
        name="Savings Reserve",
        account_type=AccountType.SAVINGS,
        currency="USD",
        opening_balance=to_cents("200.00"),
        current_balance=to_cents("200.00")
    )
    db_session.add_all([acc_a, acc_b])
    db_session.commit()
    db_session.refresh(acc_a)
    db_session.refresh(acc_b)

    # 2. Record Confirmed Income: $2,000 into Account A (stored as cents)
    income_tx = Transaction(
        user_id=user_id,
        type=TransactionType.INCOME,
        amount=to_cents("2000.00"),
        currency="USD",
        fee_amount=0,
        description="Client Project Milestone",
        date=date.today(),
        destination_account_id=acc_a.id,
        is_business=True,
        status="CONFIRMED"
    )
    db_session.add(income_tx)

    # 3. Record Confirmed Expenses: $500 from Account A
    expense_tx = Transaction(
        user_id=user_id,
        type=TransactionType.EXPENSE,
        amount=to_cents("500.00"),
        currency="USD",
        fee_amount=0,
        description="Software subscriptions & hosting",
        date=date.today(),
        source_account_id=acc_a.id,
        is_business=True,
        is_tax_deductible=True,
        status="CONFIRMED"
    )
    db_session.add(expense_tx)

    # 4. Record Transfer of $200 from Account A to Account B
    transfer_tx = Transaction(
        user_id=user_id,
        type=TransactionType.TRANSFER,
        amount=to_cents("200.00"),
        currency="USD",
        fee_amount=0,
        description="Internal transfer to savings",
        date=date.today(),
        source_account_id=acc_a.id,
        destination_account_id=acc_b.id,
        status="CONFIRMED"
    )
    db_session.add(transfer_tx)
    db_session.commit()

    # Recalculate balances
    bal_a = FinancialEngine.recalculate_account_balance(db_session, acc_a.id)
    bal_b = FinancialEngine.recalculate_account_balance(db_session, acc_b.id)

    # Account A: 800 (opening) + 2000 (income) - 500 (expense) - 200 (transfer out) = 2,100
    assert bal_a == Decimal("2100.00")
    # Account B: 200 (opening) + 200 (transfer in) = 400
    assert bal_b == Decimal("400.00")

    # 5. Calculate Consolidated Metrics
    metrics = FinancialEngine.calculate_dashboard_metrics(db=db_session, user_id=user_id)

    # Verifications
    assert metrics["total_income"] == Decimal("2000.00"), "Income must be exactly $2,000"
    assert metrics["total_expenses"] == Decimal("500.00"), "Expenses must be exactly $500"
    assert metrics["net_cash_flow"] == Decimal("1500.00"), "Net cash flow must be exactly +$1,500"
    assert metrics["total_account_balance"] == Decimal("2500.00"), "Consolidated balance must be $2,500 ($1000 + $1500)"
    assert metrics["business_profit"] == Decimal("1500.00"), "Operating profit must be $1,500"

    # Tax reserve target: 25% of ($2000 - $500) = $375.00
    assert metrics["estimated_tax_reserve"] == Decimal("375.00"), "Tax reserve target must be 25% of taxable profit ($375)"


def test_invoice_partial_payment_and_isolation(db_session):
    """
    Tests invoice calculation, partial payment settlement, and user data isolation.
    """
    user_a = "freelancer-a"
    user_b = "freelancer-b"

    # User A Account (cents)
    acc_a = Account(user_id=user_a, name="Checking", currency="USD", opening_balance=0, current_balance=0)
    db_session.add(acc_a)
    db_session.commit()

    # Invoice for $1,000 with 10% tax = $1,100
    items = [{"quantity": 10, "unit_price": 100}]
    totals = FinancialEngine.calculate_invoice_totals(items=items, discount_amount=Decimal("0.00"), tax_rate_percent=Decimal("10.00"))
    assert totals["subtotal"] == Decimal("1000.00")
    assert totals["tax_amount"] == Decimal("100.00")
    assert totals["total_amount"] == Decimal("1100.00")

    inv = Invoice(
        user_id=user_a,
        client_id="client-123",
        invoice_number="INV-001",
        status=InvoiceStatus.SENT,
        issue_date=date.today(),
        due_date=date.today(),
        currency="USD",
        subtotal=to_cents(totals["subtotal"]),
        discount_amount=0,
        tax_rate=Decimal("10.00"),
        tax_amount=to_cents(totals["tax_amount"]),
        total_amount=to_cents(totals["total_amount"]),
        amount_paid=0,
        balance_due=to_cents(totals["total_amount"])
    )
    db_session.add(inv)
    db_session.commit()

    # Partial payment of $400 (stored as cents)
    pay_amount = to_cents("400.00")
    inv.amount_paid = (inv.amount_paid or 0) + pay_amount
    inv.balance_due = (inv.total_amount or 0) - inv.amount_paid
    inv.status = InvoiceStatus.PARTIALLY_PAID

    tx = Transaction(
        user_id=user_a,
        type=TransactionType.INCOME,
        amount=pay_amount,
        currency="USD",
        fee_amount=0,
        description="Partial payment INV-001",
        date=date.today(),
        destination_account_id=acc_a.id,
        is_business=True,
        status="CONFIRMED"
    )
    db_session.add(tx)
    db_session.commit()

    FinancialEngine.recalculate_account_balance(db_session, acc_a.id)

    # Check User A Metrics
    metrics_a = FinancialEngine.calculate_dashboard_metrics(db=db_session, user_id=user_a)
    assert metrics_a["total_income"] == Decimal("400.00")
    assert metrics_a["outstanding_invoices"] == Decimal("700.00")
    assert metrics_a["total_account_balance"] == Decimal("400.00")

    # Check User B Isolation: User B must see $0.00
    metrics_b = FinancialEngine.calculate_dashboard_metrics(db=db_session, user_id=user_b)
    assert metrics_b["total_income"] == Decimal("0.00")
    assert metrics_b["total_account_balance"] == Decimal("0.00")
    assert metrics_b["outstanding_invoices"] == Decimal("0.00")
