"""catalogo_productos.ver_3d

Escrita a mano (sin autogenerate). Solo agrega una columna.

Revision ID: d5a91e7c2b40
Revises: c4d82f1a9b30
"""
from alembic import op
import sqlalchemy as sa

revision = "d5a91e7c2b40"
down_revision = "c4d82f1a9b30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "catalogo_productos",
        sa.Column("ver_3d", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("catalogo_productos", "ver_3d")
