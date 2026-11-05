"""
Pydantic schemas for API request / response validation.

All monetary ``amount`` fields in schemas are **display-ready Decimal
values** (e.g. ``50000.00``).  Conversion to / from integer cents
happens inside the API endpoint handlers using ``backend.app.engine.money``.
"""

import datetime as dt
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from backend.app.models.models import (
    TransactionType, AccountType, InvoiceStatus, BudgetPeriod, BillingFrequency
)


class SafeBaseModel(BaseModel):
    """Automatically normalise empty strings to None so Pydantic/Postgres
    don't choke on ``""`` for optional date / FK fields."""

    @model_validator(mode="before")
    @classmethod
    def normalize_empty_strings_to_none(cls, values: Any) -> Any:
        if isinstance(values, dict):
            return {
                k: (None if isinstance(v, str) and v.strip() == "" else v)
                for k, v in values.items()
            }
        return values


# ── Auth ─────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    sub: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str] = None


# ── User Profile ─────────────────────────────────────────────────────────

class UserProfileBase(SafeBaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    base_currency: str = "USD"
    fiscal_year_start: int = 1
    country: str = "US"
    tax_reserve_rate: Decimal = Decimal("25.00")

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    created_at: dt.datetime
    updated_at: dt.datetime


# ── Account ──────────────────────────────────────────────────────────────

class AccountBase(SafeBaseModel):
    name: str
    account_type: AccountType = AccountType.BANK
    currency: str = "USD"
    opening_balance: Decimal = Decimal("0.00")
    opening_balance_date: dt.date = Field(default_factory=dt.date.today)
    notes: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(SafeBaseModel):
    name: Optional[str] = None
    account_type: Optional[AccountType] = None
    notes: Optional[str] = None
    is_archived: Optional[bool] = None

class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    name: str
    account_type: AccountType
    currency: str
    opening_balance: Decimal
    opening_balance_date: dt.date
    current_balance: Decimal
    is_archived: bool
    notes: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime


# ── Category ─────────────────────────────────────────────────────────────

class CategoryBase(SafeBaseModel):
    name: str
    type: str
    is_tax_deductible: bool = True
    color: str = "#6366f1"
    icon: str = "Tag"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    is_system: bool
    created_at: dt.datetime


# ── Client ───────────────────────────────────────────────────────────────

class ClientBase(SafeBaseModel):
    name: str
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    country: Optional[str] = None
    default_currency: str = "USD"
    payment_terms: str = "Net 30"
    notes: Optional[str] = None
    status: str = "ACTIVE"

class ClientCreate(ClientBase):
    pass

class ClientUpdate(SafeBaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    country: Optional[str] = None
    default_currency: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ClientResponse(ClientBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    created_at: dt.datetime
    updated_at: dt.datetime


# ── Project ──────────────────────────────────────────────────────────────

class ProjectBase(SafeBaseModel):
    client_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    agreed_amount: Decimal = Decimal("0.00")
    currency: str = "USD"
    budget: Decimal = Decimal("0.00")
    status: str = "IN_PROGRESS"
    start_date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(SafeBaseModel):
    client_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    agreed_amount: Optional[Decimal] = None
    currency: Optional[str] = None
    budget: Optional[Decimal] = None
    status: Optional[str] = None
    start_date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    created_at: dt.datetime
    updated_at: dt.datetime


# ── Transaction ──────────────────────────────────────────────────────────

class TransactionCreate(SafeBaseModel):
    type: TransactionType
    amount: Decimal
    currency: str = "USD"
    fee_amount: Decimal = Decimal("0.00")
    description: str
    date: dt.date = Field(default_factory=dt.date.today)
    source_account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    category_id: Optional[str] = None
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    is_business: bool = True
    is_tax_deductible: bool = True
    payment_method: Optional[str] = None
    status: str = "CONFIRMED"
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

class TransactionUpdate(SafeBaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    fee_amount: Optional[Decimal] = None
    description: Optional[str] = None
    date: Optional[dt.date] = None
    source_account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    category_id: Optional[str] = None
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    is_business: Optional[bool] = None
    is_tax_deductible: Optional[bool] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: TransactionType
    amount: Decimal
    currency: str
    fee_amount: Decimal
    description: str
    date: dt.date
    source_account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    category_id: Optional[str] = None
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    is_business: bool
    is_tax_deductible: bool
    payment_method: Optional[str] = None
    status: str
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime
    category_name: Optional[str] = None
    account_name: Optional[str] = None
    client_name: Optional[str] = None
    project_name: Optional[str] = None


# ── Invoice ──────────────────────────────────────────────────────────────

class InvoiceItemCreate(SafeBaseModel):
    description: str
    quantity: Decimal = Decimal("1.0")
    unit_price: Decimal

class InvoiceItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    invoice_id: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal

class InvoiceCreate(SafeBaseModel):
    client_id: str
    project_id: Optional[str] = None
    invoice_number: str
    issue_date: dt.date = Field(default_factory=dt.date.today)
    due_date: dt.date
    currency: str = "USD"
    discount_amount: Decimal = Decimal("0.00")
    tax_rate: Decimal = Decimal("0.00")
    notes: Optional[str] = None
    payment_instructions: Optional[str] = None
    items: List[InvoiceItemCreate]

class InvoiceUpdate(SafeBaseModel):
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    due_date: Optional[dt.date] = None
    currency: Optional[str] = None
    discount_amount: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    notes: Optional[str] = None
    payment_instructions: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None

class InvoicePaymentCreate(SafeBaseModel):
    amount: Decimal
    fee_amount: Decimal = Decimal("0.00")
    payment_date: dt.date = Field(default_factory=dt.date.today)
    account_id: str
    notes: Optional[str] = None

class InvoicePaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount: Decimal
    fee_amount: Decimal
    payment_date: dt.date
    account_id: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: dt.datetime

class InvoiceResponse(BaseModel):
    id: str
    user_id: str
    client_id: str
    project_id: Optional[str] = None
    invoice_number: str
    status: InvoiceStatus
    issue_date: dt.date
    due_date: dt.date
    currency: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    notes: Optional[str] = None
    payment_instructions: Optional[str] = None
    items: List[InvoiceItemResponse] = []
    payments: List[InvoicePaymentResponse] = []
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    client_email: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime


# ── Budget ───────────────────────────────────────────────────────────────

class BudgetCategoryItem(SafeBaseModel):
    category_id: str
    allocated_amount: Decimal

class BudgetCreate(SafeBaseModel):
    name: str
    period: BudgetPeriod = BudgetPeriod.MONTHLY
    start_date: dt.date
    end_date: dt.date
    total_allocated: Decimal
    currency: str = "USD"
    is_rollover: bool = False
    categories: List[BudgetCategoryItem] = []

class BudgetUpdate(SafeBaseModel):
    name: Optional[str] = None
    period: Optional[BudgetPeriod] = None
    start_date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None
    total_allocated: Optional[Decimal] = None
    currency: Optional[str] = None
    is_rollover: Optional[bool] = None
    categories: Optional[List[BudgetCategoryItem]] = None

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    period: BudgetPeriod
    start_date: dt.date
    end_date: dt.date
    total_allocated: Decimal
    currency: str
    spent_amount: Decimal = Decimal("0.00")
    remaining_amount: Decimal = Decimal("0.00")
    utilization_percentage: Decimal = Decimal("0.00")
    is_rollover: bool
    categories: List[Dict[str, Any]] = []
    created_at: dt.datetime


# ── Subscription ─────────────────────────────────────────────────────────

class SubscriptionCreate(SafeBaseModel):
    name: str
    vendor: Optional[str] = None
    amount: Decimal
    currency: str = "USD"
    billing_frequency: BillingFrequency = BillingFrequency.MONTHLY
    next_payment_date: dt.date
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    notes: Optional[str] = None

class SubscriptionUpdate(SafeBaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    billing_frequency: Optional[BillingFrequency] = None
    next_payment_date: Optional[dt.date] = None
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    name: str
    vendor: Optional[str] = None
    amount: Decimal
    currency: str
    billing_frequency: BillingFrequency
    next_payment_date: dt.date
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: dt.datetime


# ── Savings ──────────────────────────────────────────────────────────────

class SavingsGoalCreate(SafeBaseModel):
    name: str
    target_amount: Decimal
    currency: str = "USD"
    target_date: Optional[dt.date] = None
    notes: Optional[str] = None

class SavingsGoalUpdate(SafeBaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    currency: Optional[str] = None
    target_date: Optional[dt.date] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None

class SavingsGoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: Decimal
    currency: str
    current_amount: Decimal
    target_date: Optional[dt.date] = None
    progress_percentage: Decimal = Decimal("0.00")
    is_completed: bool
    notes: Optional[str] = None
    created_at: dt.datetime

class SavingsContributionCreate(SafeBaseModel):
    amount: Decimal
    contribution_date: dt.date = Field(default_factory=dt.date.today)
    account_id: Optional[str] = None
    notes: Optional[str] = None


# ── Tax ──────────────────────────────────────────────────────────────────

class TaxProfileCreate(BaseModel):
    country: str = "US"
    jurisdiction: str = "Federal"
    tax_year: int
    estimated_tax_rate: Decimal = Decimal("25.00")
    tax_reserve_percentage: Decimal = Decimal("25.00")
    notes: Optional[str] = None

class TaxPaymentCreate(BaseModel):
    amount: Decimal
    currency: str = "USD"
    payment_date: dt.date = Field(default_factory=dt.date.today)
    tax_year: int
    account_id: Optional[str] = None
    notes: Optional[str] = None
