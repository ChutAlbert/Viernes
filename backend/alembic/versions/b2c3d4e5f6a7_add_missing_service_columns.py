"""add missing columns to website_services

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "website_services",
        sa.Column("slug", sa.String(255), nullable=True, unique=True),
    )
    op.add_column(
        "website_services",
        sa.Column("long_description", sa.Text(), nullable=True),
    )
    op.add_column(
        "website_services",
        sa.Column("image_urls", sa.Text(), nullable=True),
    )
    op.create_index("ix_website_services_slug", "website_services", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_website_services_slug", table_name="website_services")
    op.drop_column("website_services", "image_urls")
    op.drop_column("website_services", "long_description")
    op.drop_column("website_services", "slug")
