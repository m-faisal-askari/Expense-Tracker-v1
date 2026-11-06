"""Retire legacy SHA-256 password hashes after moving auth to Supabase.

Revision ID: d7e4c2f891ab
Revises: c9a7310f4e01
"""
from alembic import op

revision = "d7e4c2f891ab"
down_revision = "c9a7310f4e01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Legacy hashes were plain SHA-256 with one global salt. Backend password
    # authentication has been retired; Supabase is now the sole password store.
    op.execute(
        "UPDATE user_accounts SET password_hash = NULL "
        "WHERE password_hash IS NOT NULL AND length(password_hash) = 64"
    )


def downgrade() -> None:
    # Retired hashes cannot be restored. Users authenticate through Supabase.
    pass
