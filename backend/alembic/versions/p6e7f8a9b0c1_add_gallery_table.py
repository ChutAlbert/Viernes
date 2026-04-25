"""add gallery_items table

Revision ID: p6e7f8a9b0c1
Revises: o5d6e7f8a9b0
Create Date: 2026-04-24
"""
from alembic import op
import sqlalchemy as sa

revision = "p6e7f8a9b0c1"
down_revision = "o5d6e7f8a9b0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "gallery_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=False, server_default=""),
        sa.Column("media_type", sa.String(20), nullable=False),
        sa.Column("tags", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "gallery_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("passphrase_hash", sa.String(255), nullable=False),
        sa.Column("kdf_salt", sa.String(255), nullable=False),
    )


def downgrade():
    op.drop_table("gallery_config")
    op.drop_table("gallery_items")
