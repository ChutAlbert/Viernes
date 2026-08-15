"""fusion piezas-catalogo

Revision ID: 7329d1ac5428
Revises: u1j2k3l4m5n6
Create Date: 2026-07-29 00:38:23.811439

Solo altera catalogo_productos (unifica precios/catalogo/piezas).
Los drops de piezas/website_* que autogenerate propuso eran falsos positivos
(esos modelos no están en la metadata de alembic) — se removieron a mano.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7329d1ac5428'
down_revision: Union[str, Sequence[str], None] = 'u1j2k3l4m5n6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Estado unificado (server_default para filas existentes)
    op.add_column('catalogo_productos', sa.Column('es_vendida', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('catalogo_productos', sa.Column('tipo_venta', sa.String(length=50), nullable=False, server_default=sa.text("'venta_general'")))
    # Datos de venta (opcionales)
    op.add_column('catalogo_productos', sa.Column('persona', sa.String(length=255), nullable=True))
    op.add_column('catalogo_productos', sa.Column('precios_venta', sa.Text(), nullable=True))
    op.add_column('catalogo_productos', sa.Column('monto_pagado', sa.Float(), nullable=True))
    op.add_column('catalogo_productos', sa.Column('pagos', sa.Text(), nullable=True))
    op.add_column('catalogo_productos', sa.Column('fecha_encargo', sa.String(length=20), nullable=True))
    op.add_column('catalogo_productos', sa.Column('fecha_entrega', sa.String(length=20), nullable=True))
    op.add_column('catalogo_productos', sa.Column('fecha_pago', sa.String(length=20), nullable=True))
    op.add_column('catalogo_productos', sa.Column('notas_venta', sa.Text(), nullable=True))
    # Campos de cálculo/tamaño ahora opcionales (permite borradores)
    op.alter_column('catalogo_productos', 'tiempo_impresion_minutos', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=True)
    op.alter_column('catalogo_productos', 'tamano_base_mm', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=True)
    op.alter_column('catalogo_productos', 'tamano_minimo_mm', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=True)
    op.alter_column('catalogo_productos', 'tamano_maximo_mm', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=True)


def downgrade() -> None:
    op.alter_column('catalogo_productos', 'tamano_maximo_mm', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=False)
    op.alter_column('catalogo_productos', 'tamano_minimo_mm', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=False)
    op.alter_column('catalogo_productos', 'tamano_base_mm', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=False)
    op.alter_column('catalogo_productos', 'tiempo_impresion_minutos', existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=False)
    op.drop_column('catalogo_productos', 'notas_venta')
    op.drop_column('catalogo_productos', 'fecha_pago')
    op.drop_column('catalogo_productos', 'fecha_entrega')
    op.drop_column('catalogo_productos', 'fecha_encargo')
    op.drop_column('catalogo_productos', 'pagos')
    op.drop_column('catalogo_productos', 'monto_pagado')
    op.drop_column('catalogo_productos', 'precios_venta')
    op.drop_column('catalogo_productos', 'persona')
    op.drop_column('catalogo_productos', 'tipo_venta')
    op.drop_column('catalogo_productos', 'es_vendida')
