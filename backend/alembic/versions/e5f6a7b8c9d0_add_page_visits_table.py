"""add page_visits table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-13 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "page_visits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ip_address", sa.String(length=45), nullable=False),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("path", sa.String(length=255), nullable=True),
        sa.Column("visited_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_page_visits_visited_at", "page_visits", ["visited_at"])


def downgrade() -> None:
    op.drop_index("ix_page_visits_visited_at", table_name="page_visits")
    op.drop_table("page_visits")
