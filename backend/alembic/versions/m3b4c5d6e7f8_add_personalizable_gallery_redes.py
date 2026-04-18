"""add es_personalizable, catalogo_producto_imagenes, redes_sociales

Revision ID: m3b4c5d6e7f8
Revises: l2a3b4c5d6e7
Create Date: 2026-04-17
"""
from alembic import op
import sqlalchemy as sa

revision = "m3b4c5d6e7f8"
down_revision = "l2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    # es_personalizable en productos
    op.add_column("catalogo_productos", sa.Column("es_personalizable", sa.Boolean(), nullable=True, server_default="0"))

    # Galería de imágenes por producto
    op.create_table(
        "catalogo_producto_imagenes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("producto_id", sa.Integer(), sa.ForeignKey("catalogo_productos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Redes sociales administrables
    op.create_table(
        "redes_sociales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(80), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("icono", sa.String(50), nullable=False),  # instagram, facebook, whatsapp, tiktok, x, youtube, etc.
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("redes_sociales")
    op.drop_table("catalogo_producto_imagenes")
    op.drop_column("catalogo_productos", "es_personalizable")
