"""add slug to catalogo_productos

Revision ID: k1f2a3b4c5d6
Revises: j0e1f2a3b4c5
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

revision = "k1f2a3b4c5d6"
down_revision = "j0e1f2a3b4c5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("catalogo_productos", sa.Column("slug", sa.String(220), nullable=True))
    op.create_index("ix_catalogo_productos_slug", "catalogo_productos", ["slug"], unique=True)


def downgrade():
    op.drop_index("ix_catalogo_productos_slug", table_name="catalogo_productos")
    op.drop_column("catalogo_productos", "slug")
