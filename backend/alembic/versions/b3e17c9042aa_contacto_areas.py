"""website_contacts.areas

Escrita a mano (sin autogenerate). Solo agrega una columna.

Revision ID: b3e17c9042aa
Revises: f7a91c3b5d20
"""
from alembic import op
import sqlalchemy as sa

revision = "b3e17c9042aa"
down_revision = "f7a91c3b5d20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "website_contacts",
        sa.Column(
            "areas",
            sa.String(length=100),
            nullable=False,
            server_default="software,impresion3d",
        ),
    )


def downgrade() -> None:
    op.drop_column("website_contacts", "areas")
