"""add gallery_config table

Revision ID: q7f8a9b0c1d2
Revises: p6e7f8a9b0c1
Create Date: 2026-04-24
"""
from alembic import op
import sqlalchemy as sa

revision = "q7f8a9b0c1d2"
down_revision = "p6e7f8a9b0c1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "gallery_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("passphrase_hash", sa.String(255), nullable=False),
        sa.Column("kdf_salt", sa.String(255), nullable=False),
    )


def downgrade():
    op.drop_table("gallery_config")
