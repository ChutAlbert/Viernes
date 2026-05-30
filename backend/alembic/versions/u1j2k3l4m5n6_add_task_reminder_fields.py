"""add task reminder fields (due_time + reminders)

Revision ID: u1j2k3l4m5n6
Revises: t0i1j2k3l4m5
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "u1j2k3l4m5n6"
down_revision = "t0i1j2k3l4m5"
branch_labels = None
depends_on = None


def upgrade():
    # Hora de la tarea (HH:MM) para programar notificaciones exactas
    op.add_column("tasks", sa.Column("due_time", sa.String(5), nullable=True))

    # Recordatorios: master switch + cuáles activar
    op.add_column("tasks", sa.Column("reminders_enabled",       sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("tasks", sa.Column("reminder_12h",            sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("tasks", sa.Column("reminder_30m",            sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("tasks", sa.Column("reminder_10m",            sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("tasks", sa.Column("reminder_custom_minutes", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("tasks", "reminder_custom_minutes")
    op.drop_column("tasks", "reminder_10m")
    op.drop_column("tasks", "reminder_30m")
    op.drop_column("tasks", "reminder_12h")
    op.drop_column("tasks", "reminders_enabled")
    op.drop_column("tasks", "due_time")
