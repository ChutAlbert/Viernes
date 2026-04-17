"""add inventario tables

Revision ID: i9d0e1f2a3b4
Revises: h8c9d0e1f2a3
Create Date: 2026-04-16 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "i9d0e1f2a3b4"
down_revision: Union[str, None] = "h8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "inventario_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("categoria", sa.String(50), nullable=False),   # filamento|boquilla|herramienta|quimico|otro
        sa.Column("tipo", sa.String(20), nullable=False),        # consumible|no_consumible
        sa.Column("unidad", sa.String(20), nullable=False),      # kg|g|piezas|m|l|otro
        sa.Column("cantidad_actual", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("cantidad_minima", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("precio_referencia", sa.Float(), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "inventario_compras",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("inventario_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cantidad", sa.Float(), nullable=False),
        sa.Column("precio_total", sa.Float(), nullable=False),
        sa.Column("fecha", sa.String(20), nullable=False),
        sa.Column("proveedor", sa.String(200), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("inventario_compras")
    op.drop_table("inventario_items")
