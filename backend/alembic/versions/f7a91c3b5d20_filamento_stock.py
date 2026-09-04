"""stock del filamento en catalogo_filamentos (unifica inventario de filamentos)

Revision ID: f7a91c3b5d20
Revises: 7329d1ac5428
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f7a91c3b5d20'
down_revision: Union[str, Sequence[str], None] = '7329d1ac5428'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('catalogo_filamentos', sa.Column('cantidad_actual', sa.Float(), nullable=False, server_default='0'))
    op.add_column('catalogo_filamentos', sa.Column('cantidad_minima', sa.Float(), nullable=False, server_default='0'))
    op.add_column('catalogo_filamentos', sa.Column('unidad', sa.String(length=20), nullable=False, server_default='kg'))
    op.add_column('catalogo_filamentos', sa.Column('precio_referencia', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('catalogo_filamentos', 'precio_referencia')
    op.drop_column('catalogo_filamentos', 'unidad')
    op.drop_column('catalogo_filamentos', 'cantidad_minima')
    op.drop_column('catalogo_filamentos', 'cantidad_actual')
