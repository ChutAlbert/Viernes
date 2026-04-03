"""website content tables

Revision ID: a1b2c3d4e5f6
Revises: 5877b7f8a578
Create Date: 2026-04-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "2a782575d00f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "website_services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(100), nullable=False, server_default="code"),
        sa.Column("category", sa.String(100), nullable=False, server_default="general"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "website_contacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("contact_type", sa.String(50), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "website_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(255), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("github_url", sa.String(500), nullable=True),
        sa.Column("linkedin_url", sa.String(500), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "website_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("value", sa.Text(), nullable=False),
    )

    # Seed default settings
    op.execute("""
        INSERT INTO website_settings (key, value) VALUES
        ('hero_title', 'Soluciones Digitales a tu Medida'),
        ('hero_subtitle', 'Desarrollo de Software · Impresión 3D · Diseño'),
        ('hero_description', 'Transformamos tus ideas en productos reales. Desde software personalizado hasta prototipos físicos.'),
        ('company_name', 'Viernes'),
        ('company_tagline', 'Construimos el futuro, hoy.')
    """)

    # Seed default services
    op.execute("""
        INSERT INTO website_services (title, description, icon, category, order_index, is_active) VALUES
        ('Software a Medida', 'Desarrollamos aplicaciones web y móviles personalizadas adaptadas exactamente a tus necesidades de negocio.', 'code', 'software', 0, true),
        ('Impresión 3D', 'Prototipado rápido y fabricación de piezas personalizadas con impresión 3D de alta precisión.', 'printer', 'hardware', 1, true),
        ('Diseño de Layouts', 'Diseño de interfaces y experiencias de usuario atractivas y funcionales para tus proyectos.', 'layout', 'design', 2, true),
        ('Consultoría Tech', 'Asesoramiento técnico para tomar las mejores decisiones tecnológicas en tu empresa.', 'lightbulb', 'consulting', 3, true)
    """)


def downgrade() -> None:
    op.drop_table("website_settings")
    op.drop_table("website_members")
    op.drop_table("website_contacts")
    op.drop_table("website_services")
