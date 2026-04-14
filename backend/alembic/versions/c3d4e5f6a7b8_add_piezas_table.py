"""add piezas table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "piezas",
        sa.Column("id", sa.Integer(), primary_key=True),
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
        sa.Column("sincronizado_sodigic", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("piezas")
