"""Convert all monetary columns from Numeric to BigInteger cents

Revision ID: c9a7310f4e01
Revises: 164f1ed9546b
Create Date: 2026-11-05 20:37:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9a7310f4e01'
down_revision: Union[str, Sequence[str], None] = '164f1ed9546b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Tables and their monetary columns that must be converted from
# Numeric(15,4) → BigInteger (storing cents = value * 100).
MONETARY_COLUMNS = {
    "accounts": ["opening_balance", "current_balance"],
    "transactions": ["amount", "fee_amount"],
    "invoices": ["subtotal", "discount_amount", "tax_amount", "total_amount", "amount_paid", "balance_due"],
    "invoice_items": ["unit_price", "total_amount"],
    "invoice_payments": ["amount", "fee_amount"],
    "budgets": ["total_allocated"],
    "budget_categories": ["allocated_amount"],
    "subscriptions": ["amount"],
    "savings_goals": ["target_amount", "current_amount"],
    "savings_contributions": ["amount"],
    "projects": ["agreed_amount", "budget"],
    "tax_payments": ["amount"],
}

# Columns to drop (no longer needed in the cents model)
DROP_COLUMNS = {
    "transactions": ["base_amount", "exchange_rate"],
    "invoices": ["exchange_rate"],
}


def upgrade() -> None:
    # 1. Convert each monetary column: multiply existing values by 100,
    #    then cast to BIGINT.
    for table, columns in MONETARY_COLUMNS.items():
        for col in columns:
            # First update the data in-place (Numeric * 100, rounded to int)
            op.execute(
                sa.text(f'UPDATE "{table}" SET "{col}" = ROUND("{col}" * 100)')
            )
            # Then alter the column type
            op.alter_column(
                table, col,
                type_=sa.BigInteger(),
                existing_nullable=False,
                postgresql_using=f'"{col}"::bigint',
            )

    # 2. Drop obsolete columns
    for table, columns in DROP_COLUMNS.items():
        for col in columns:
            try:
                op.drop_column(table, col)
            except Exception:
                pass  # column may already be gone

    # 3. Add currency column to budgets if missing
    try:
        op.add_column("budgets", sa.Column("currency", sa.String(3), server_default="USD", nullable=False))
    except Exception:
        pass


def downgrade() -> None:
    # Reverse: convert BigInteger cents back to Numeric by dividing by 100
    for table, columns in MONETARY_COLUMNS.items():
        for col in columns:
            op.alter_column(
                table, col,
                type_=sa.Numeric(15, 4),
                existing_nullable=False,
                postgresql_using=f'("{col}"::numeric / 100)',
            )

    # Re-add dropped columns
    for table, columns in DROP_COLUMNS.items():
        for col in columns:
            if col == "base_amount":
                op.add_column(table, sa.Column(col, sa.Numeric(15, 4), nullable=True))
            elif col == "exchange_rate":
                op.add_column(table, sa.Column(col, sa.Numeric(15, 6), nullable=True))

    try:
        op.drop_column("budgets", "currency")
    except Exception:
        pass
