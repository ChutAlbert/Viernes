"""recreate website tables (dropped accidentally in 3bae22668b71)

Revision ID: t0i1j2k3l4m5
Revises: s9h0i1j2k3l4
Create Date: 2026-05-23 00:01:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "t0i1j2k3l4m5"
down_revision: Union[str, None] = "s9h0i1j2k3l4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── website_services ──────────────────────────────────────────────────────
    op.create_table(
        "website_services",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("long_description", sa.Text(), nullable=True),
        sa.Column("image_urls", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(100), nullable=False, server_default="code"),
        sa.Column("category", sa.String(100), nullable=False, server_default="general"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("slug", sa.String(255), nullable=True, unique=True),
    )
    op.create_index("ix_website_services_slug", "website_services", ["slug"], unique=True)

    # ── website_contacts ──────────────────────────────────────────────────────
    op.create_table(
        "website_contacts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("contact_type", sa.String(50), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    # ── website_members ───────────────────────────────────────────────────────
    op.create_table(
        "website_members",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(255), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("github_url", sa.String(500), nullable=True),
        sa.Column("linkedin_url", sa.String(500), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    # ── website_settings ──────────────────────────────────────────────────────
    op.create_table(
        "website_settings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("value", sa.Text(), nullable=False),
    )
    op.create_index("ix_website_settings_key", "website_settings", ["key"], unique=True)

    # Seed settings por defecto
    op.execute("""
        INSERT INTO website_settings (key, value) VALUES
        ('hero_title', 'Soluciones Digitales a tu Medida'),
        ('hero_subtitle', 'Desarrollo de Software · Impresión 3D · Diseño'),
        ('hero_description', 'Transformamos tus ideas en productos reales.'),
        ('company_name', 'SODIGIC'),
        ('company_tagline', 'Construimos el futuro, hoy.')
    """)

    # Seed servicios por defecto
    op.execute("""
        INSERT INTO website_services (title, description, icon, category, order_index, is_active) VALUES
        ('Desarrollo de Software', 'Apps web y sistemas a medida para tu negocio.', 'code', 'software', 0, true),
        ('Impresión 3D', 'Prototipos y piezas personalizadas con tecnología propia.', 'printer', 'hardware', 1, true)
    """)


def downgrade() -> None:
    op.drop_index("ix_website_settings_key", table_name="website_settings")
    op.drop_table("website_settings")
    op.drop_table("website_members")
    op.drop_table("website_contacts")
    op.drop_index("ix_website_services_slug", table_name="website_services")
    op.drop_table("website_services")
