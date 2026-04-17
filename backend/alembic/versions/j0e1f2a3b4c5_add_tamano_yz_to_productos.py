"""add tamano_y_mm and tamano_z_mm to catalogo_productos

Revision ID: j0e1f2a3b4c5
Revises: i9d0e1f2a3b4
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

revision = "j0e1f2a3b4c5"
down_revision = "i9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("catalogo_productos", sa.Column("tamano_y_mm", sa.Float(), nullable=True))
    op.add_column("catalogo_productos", sa.Column("tamano_z_mm", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("catalogo_productos", "tamano_z_mm")
    op.drop_column("catalogo_productos", "tamano_y_mm")
