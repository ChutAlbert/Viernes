"""add catalogo tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "catalogo_materiales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("tarifa_por_minuto", sa.Float(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "catalogo_colores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("hex_codigo", sa.String(7), nullable=False),
        sa.Column("multiplicador_precio", sa.Float(), nullable=False, server_default=sa.text("1.0")),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "catalogo_productos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(255), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("archivo_3d_url", sa.String(500), nullable=True),
        sa.Column("foto_preview_url", sa.String(500), nullable=True),
        sa.Column("tiempo_impresion_minutos", sa.Float(), nullable=False),
        sa.Column("tamano_base_mm", sa.Float(), nullable=False),
        sa.Column("tamano_minimo_mm", sa.Float(), nullable=False),
        sa.Column("tamano_maximo_mm", sa.Float(), nullable=False),
        sa.Column("permite_multicolor", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("max_colores", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("publicado", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "catalogo_producto_materiales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("producto_id", sa.Integer(), sa.ForeignKey("catalogo_productos.id"), nullable=False),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("catalogo_materiales.id"), nullable=False),
        sa.Column("archivo_3d_url", sa.String(500), nullable=True),
    )

    op.create_table(
        "catalogo_producto_colores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("producto_id", sa.Integer(), sa.ForeignKey("catalogo_productos.id"), nullable=False),
        sa.Column("color_id", sa.Integer(), sa.ForeignKey("catalogo_colores.id"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("catalogo_producto_colores")
    op.drop_table("catalogo_producto_materiales")
    op.drop_table("catalogo_productos")
    op.drop_table("catalogo_colores")
    op.drop_table("catalogo_materiales")
