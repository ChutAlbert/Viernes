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
    op.execute("CREATE TABLE IF NOT EXISTS gallery_config (id SERIAL PRIMARY KEY, passphrase_hash VARCHAR(255) NOT NULL, kdf_salt VARCHAR(255) NOT NULL)")


def downgrade():
    op.drop_table("gallery_config")
