"""
Database models for the Freelancer Financial Management Platform.

MONETARY STORAGE CONVENTION
============================
Every monetary column is a ``BigInteger`` that stores the amount as
**integer cents** (minor units ×100) in the **original transaction currency**.

    50 000.00 PKR  →  5_000_000
    1 999.99 USD   →    199_999

The companion ``currency`` column records which currency those cents
belong to.  Cross-currency aggregation uses the rate table in
``backend.app.engine.money``.

Non-monetary numeric columns (``tax_rate``, ``quantity``,
``tax_reserve_rate``) stay as ``Numeric`` since they represent
percentages or counts, not money.
"""

import uuid
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, BigInteger, Numeric,
    Date, DateTime, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# ── Enums ────────────────────────────────────────────────────────────────

class TransactionType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"

class AccountType(str, Enum):
    BANK = "BANK"
    CASH = "CASH"
    DIGITAL_WALLET = "DIGITAL_WALLET"
    CREDIT_CARD = "CREDIT_CARD"
    SAVINGS = "SAVINGS"
    OTHER = "OTHER"

class InvoiceStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class BudgetPeriod(str, Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"

class BillingFrequency(str, Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMI_ANNUALLY = "SEMI_ANNUALLY"
    ANNUALLY = "ANNUALLY"


# ── Users ────────────────────────────────────────────────────────────────

class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    auth_provider = Column(String(50), default="email")
    provider_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    base_currency = Column(String(3), default="USD", nullable=False)
    fiscal_year_start = Column(Integer, default=1, nullable=False)
    country = Column(String(100), default="US")
    tax_reserve_rate = Column(Numeric(5, 2), default=Decimal("25.00"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ── Accounts ─────────────────────────────────────────────────────────────

class Account(Base):
    """Financial account (bank, cash, wallet …).
    ``opening_balance`` and ``current_balance`` are cents in ``currency``.
    """
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    account_type = Column(SQLEnum(AccountType), default=AccountType.BANK, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    opening_balance = Column(BigInteger, default=0, nullable=False)        # cents
    opening_balance_date = Column(Date, default=date.today, nullable=False)
    current_balance = Column(BigInteger, default=0, nullable=False)        # cents
    is_archived = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_account_user", "user_id"),
    )


# ── Categories ───────────────────────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    is_tax_deductible = Column(Boolean, default=True, nullable=False)
    color = Column(String(20), default="#6366f1")
    icon = Column(String(50), default="Tag")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_category_user_type", "user_id", "type"),
    )


# ── Clients ──────────────────────────────────────────────────────────────

class Client(Base):
    __tablename__ = "clients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    company_name = Column(String(200), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    billing_address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    default_currency = Column(String(3), default="USD", nullable=False)
    payment_terms = Column(String(50), default="Net 30", nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    projects = relationship("Project", back_populates="client", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="client")


# ── Projects ─────────────────────────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    client_id = Column(String(36), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    agreed_amount = Column(BigInteger, default=0, nullable=False)          # cents in currency
    currency = Column(String(3), default="USD", nullable=False)
    budget = Column(BigInteger, default=0, nullable=False)                 # cents in currency
    status = Column(String(20), default="IN_PROGRESS", nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    client = relationship("Client", back_populates="projects")
    invoices = relationship("Invoice", back_populates="project")


# ── Transactions ─────────────────────────────────────────────────────────

class Transaction(Base):
    """Ledger entry.  ``amount`` and ``fee_amount`` are integer cents in
    ``currency``.
    """
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    type = Column(SQLEnum(TransactionType), nullable=False)

    # ── Money (cents in original currency) ──
    amount = Column(BigInteger, nullable=False)                            # cents
    currency = Column(String(3), default="USD", nullable=False)
    fee_amount = Column(BigInteger, default=0, nullable=False)             # cents

    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, index=True)

    source_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    destination_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    client_id = Column(String(36), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)

    is_business = Column(Boolean, default=True, nullable=False)
    is_tax_deductible = Column(Boolean, default=True, nullable=False)
    payment_method = Column(String(50), nullable=True)
    status = Column(String(20), default="CONFIRMED", nullable=False)
    notes = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    source_account = relationship("Account", foreign_keys=[source_account_id])
    destination_account = relationship("Account", foreign_keys=[destination_account_id])
    category = relationship("Category")
    client = relationship("Client")
    project = relationship("Project")

    __table_args__ = (
        Index("idx_tx_user_date", "user_id", "date"),
        Index("idx_tx_user_type", "user_id", "type"),
    )


# ── Invoices ─────────────────────────────────────────────────────────────

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    client_id = Column(String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)

    invoice_number = Column(String(50), nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)

    subtotal = Column(BigInteger, default=0, nullable=False)               # cents
    discount_amount = Column(BigInteger, default=0, nullable=False)        # cents
    tax_rate = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)  # percentage
    tax_amount = Column(BigInteger, default=0, nullable=False)             # cents
    total_amount = Column(BigInteger, default=0, nullable=False)           # cents

    amount_paid = Column(BigInteger, default=0, nullable=False)            # cents
    balance_due = Column(BigInteger, default=0, nullable=False)            # cents

    notes = Column(Text, nullable=True)
    payment_instructions = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    client = relationship("Client", back_populates="invoices")
    project = relationship("Project", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("InvoicePayment", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_invoice_user_num", "user_id", "invoice_number", unique=True),
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(12, 4), default=Decimal("1.0000"), nullable=False)  # not money
    unit_price = Column(BigInteger, default=0, nullable=False)             # cents
    total_amount = Column(BigInteger, default=0, nullable=False)           # cents

    invoice = relationship("Invoice", back_populates="items")


class InvoicePayment(Base):
    __tablename__ = "invoice_payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(BigInteger, nullable=False)                            # cents
    fee_amount = Column(BigInteger, default=0, nullable=False)             # cents
    payment_date = Column(Date, default=date.today, nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="payments")
    transaction = relationship("Transaction")


# ── Budgets ──────────────────────────────────────────────────────────────

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    period = Column(SQLEnum(BudgetPeriod), default=BudgetPeriod.MONTHLY, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_allocated = Column(BigInteger, default=0, nullable=False)        # cents
    currency = Column(String(3), default="USD", nullable=False)
    is_rollover = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    categories = relationship("BudgetCategory", back_populates="budget", cascade="all, delete-orphan")


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    budget_id = Column(String(36), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    allocated_amount = Column(BigInteger, nullable=False)                  # cents

    budget = relationship("Budget", back_populates="categories")
    category = relationship("Category")


# ── Subscriptions ────────────────────────────────────────────────────────

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    vendor = Column(String(150), nullable=True)
    amount = Column(BigInteger, nullable=False)                            # cents
    currency = Column(String(3), default="USD", nullable=False)
    billing_frequency = Column(SQLEnum(BillingFrequency), default=BillingFrequency.MONTHLY, nullable=False)
    next_payment_date = Column(Date, nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    account = relationship("Account")
    category = relationship("Category")


# ── Savings Goals ────────────────────────────────────────────────────────

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    target_amount = Column(BigInteger, nullable=False)                     # cents
    currency = Column(String(3), default="USD", nullable=False)
    current_amount = Column(BigInteger, default=0, nullable=False)         # cents
    target_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contributions = relationship("SavingsContribution", back_populates="savings_goal", cascade="all, delete-orphan")


class SavingsContribution(Base):
    __tablename__ = "savings_contributions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    savings_goal_id = Column(String(36), ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(128), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)                            # cents
    contribution_date = Column(Date, default=date.today, nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    savings_goal = relationship("SavingsGoal", back_populates="contributions")


# ── Tax ──────────────────────────────────────────────────────────────────

class TaxProfile(Base):
    __tablename__ = "tax_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    country = Column(String(100), default="US", nullable=False)
    jurisdiction = Column(String(100), default="Federal", nullable=False)
    tax_year = Column(Integer, nullable=False)
    estimated_tax_rate = Column(Numeric(5, 2), default=Decimal("25.00"), nullable=False)
    tax_reserve_percentage = Column(Numeric(5, 2), default=Decimal("25.00"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TaxPayment(Base):
    __tablename__ = "tax_payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)                            # cents
    currency = Column(String(3), default="USD", nullable=False)
    payment_date = Column(Date, default=date.today, nullable=False)
    tax_year = Column(Integer, nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
