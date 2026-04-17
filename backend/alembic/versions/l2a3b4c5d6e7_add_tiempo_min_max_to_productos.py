"""add tiempo_minimo_minutos and tiempo_maximo_minutos to catalogo_productos

Revision ID: l2a3b4c5d6e7
Revises: k1f2a3b4c5d6
Create Date: 2026-04-17
"""
from alembic import op
import sqlalchemy as sa

revision = "l2a3b4c5d6e7"
down_revision = "k1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("catalogo_productos", sa.Column("tiempo_minimo_minutos", sa.Float(), nullable=True))
    op.add_column("catalogo_productos", sa.Column("tiempo_maximo_minutos", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("catalogo_productos", "tiempo_maximo_minutos")
    op.drop_column("catalogo_productos", "tiempo_minimo_minutos")
