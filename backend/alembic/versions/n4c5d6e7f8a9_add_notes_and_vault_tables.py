"""add notes, password_entries, and vault_config tables

Revision ID: n4c5d6e7f8a9
Revises: m3b4c5d6e7f8
Create Date: 2026-04-23
"""
from alembic import op
import sqlalchemy as sa

revision = "n4c5d6e7f8a9"
down_revision = "m3b4c5d6e7f8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False, server_default=""),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("color", sa.String(20), nullable=False, server_default="default"),
        sa.Column("pinned", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("tags", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("attachments", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "vault_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("salt", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "password_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("username_hint", sa.String(500), nullable=False, server_default=""),
        sa.Column("url", sa.String(2000), nullable=False, server_default=""),
        sa.Column("category", sa.String(100), nullable=False, server_default="general"),
        sa.Column("encrypted_data", sa.Text(), nullable=False),
        sa.Column("iv", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("password_entries")
    op.drop_table("vault_config")
    op.drop_table("notes")
