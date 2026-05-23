"""recreate piezas table (dropped accidentally in 3bae22668b71)

Revision ID: s9h0i1j2k3l4
Revises: 3bae22668b71
Create Date: 2026-05-23 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "s9h0i1j2k3l4"
down_revision: Union[str, None] = "3bae22668b71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "piezas",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(255), nullable=False),
        sa.Column("fotos", sa.Text(), nullable=True),
        sa.Column("precios", sa.Text(), nullable=True),
        sa.Column("monto_pagado", sa.Float(), nullable=True),
        sa.Column("persona", sa.String(255), nullable=True),
        sa.Column("tipo", sa.String(50), nullable=False, server_default="venta_general"),
        sa.Column("fecha_encargo", sa.String(20), nullable=True),
        sa.Column("fecha_impresion", sa.String(20), nullable=True),
        sa.Column("fecha_entrega", sa.String(20), nullable=True),
        sa.Column("fecha_pago", sa.String(20), nullable=True),
        sa.Column("filamento", sa.String(255), nullable=True),
        sa.Column("tiempo_impresion", sa.String(100), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("archivos", sa.Text(), nullable=True),
        sa.Column("pagos", sa.Text(), nullable=True),
        sa.Column("sincronizado_sodigic", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("piezas")
