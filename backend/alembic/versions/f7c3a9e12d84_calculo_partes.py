"""catalogo_productos.calculo_partes

Escrita a mano (sin autogenerate). Solo agrega una columna.

Guarda las partes de la calculadora (piezas, tiempos, gramos, tamano,
modo de color y pintado). Antes vivian solo en el estado de React y se
perdian al cambiar de pestana.

Revision ID: f7c3a9e12d84
Revises: e6b2f8d31c05
"""
from alembic import op
import sqlalchemy as sa

revision = "f7c3a9e12d84"
down_revision = "e6b2f8d31c05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "catalogo_productos",
        sa.Column("calculo_partes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("catalogo_productos", "calculo_partes")
