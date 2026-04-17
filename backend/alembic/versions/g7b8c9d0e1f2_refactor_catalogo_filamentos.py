"""refactor catalogo: reemplazar material+color por filamento

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-04-15 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "g7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Eliminar tablas del modelo anterior (many-to-many primero, luego catálogos)
    op.drop_table("catalogo_producto_colores")
    op.drop_table("catalogo_producto_materiales")
    op.drop_table("catalogo_colores")
    op.drop_table("catalogo_materiales")

    # Crear tabla de filamentos (material + color unificados con tarifa propia)
    op.create_table(
        "catalogo_filamentos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("tipo_material", sa.String(50), nullable=False),
        sa.Column("hex_codigo", sa.String(7), nullable=False),
        sa.Column("tarifa_por_minuto", sa.Float(), nullable=False),
        sa.Column("en_stock", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Crear tabla de relación producto ↔ filamento
    op.create_table(
        "catalogo_producto_filamentos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("producto_id", sa.Integer(), sa.ForeignKey("catalogo_productos.id"), nullable=False),
        sa.Column("filamento_id", sa.Integer(), sa.ForeignKey("catalogo_filamentos.id"), nullable=False),
        sa.Column("archivo_3d_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("catalogo_producto_filamentos")
    op.drop_table("catalogo_filamentos")

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
