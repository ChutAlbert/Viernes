"""add name, role, permissions, timestamps to users

Revision ID: o5d6e7f8a9b0
Revises: n4c5d6e7f8a9
Create Date: 2026-04-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

revision = "o5d6e7f8a9b0"
down_revision = "n4c5d6e7f8a9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("name", sa.String(255), nullable=False, server_default=""))
    op.add_column("users", sa.Column("role", sa.String(50), nullable=False, server_default="user"))
    op.add_column("users", sa.Column("permissions", sa.Text, nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("now()"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("now()"),
        ),
    )

    # Promote the first user to admin
    op.execute(text("UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users)"))


def downgrade():
    op.drop_column("users", "name")
    op.drop_column("users", "role")
    op.drop_column("users", "permissions")
    op.drop_column("users", "created_at")
    op.drop_column("users", "updated_at")
