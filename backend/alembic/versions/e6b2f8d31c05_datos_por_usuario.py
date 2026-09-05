"""Datos privados por usuario: notes, tasks, vault y gallery

Escrita a mano (sin autogenerate). Aditiva: agrega user_id y rellena.
No borra nada.

Hasta ahora estas tablas eran globales: cualquier usuario autenticado veia
las notas, tareas, contrasenas y la galeria de todos.

Revision ID: e6b2f8d31c05
Revises: d5a91e7c2b40
"""
from alembic import op
import sqlalchemy as sa

revision = "e6b2f8d31c05"
down_revision = "d5a91e7c2b40"
branch_labels = None
depends_on = None

# Tablas que pasan a ser por usuario. Las *_config llevan user_id unico:
# cada quien tiene su propia sal / clave maestra.
TABLAS = ["notes", "tasks", "password_entries", "gallery_items"]
CONFIGS = ["vault_config", "gallery_config"]


def upgrade() -> None:
    conn = op.get_bind()

    # Dueno de lo que ya existe: el super_admin. No hay registro de quien creo
    # cada fila, asi que se lo queda el dueno del sistema y el resto arranca vacio.
    dueno = conn.execute(sa.text(
        "SELECT id FROM users WHERE role = 'super_admin' ORDER BY id LIMIT 1"
    )).scalar()
    if dueno is None:
        dueno = conn.execute(sa.text("SELECT id FROM users ORDER BY id LIMIT 1")).scalar()
    if dueno is None:
        raise RuntimeError("No hay usuarios: no se puede asignar dueno.")

    for tabla in TABLAS + CONFIGS:
        op.add_column(tabla, sa.Column("user_id", sa.Integer(), nullable=True))
        conn.execute(sa.text(f"UPDATE {tabla} SET user_id = :d WHERE user_id IS NULL"), {"d": dueno})
        op.alter_column(tabla, "user_id", nullable=False)
        op.create_foreign_key(f"fk_{tabla}_user", tabla, "users", ["user_id"], ["id"], ondelete="CASCADE")
        op.create_index(f"ix_{tabla}_user_id", tabla, ["user_id"])

    # Sin restriccion unica en las *_config a proposito: forzarla exigiria
    # borrar filas duplicadas, y cada una guarda una sal. Perder una sal deja
    # indescifrable lo que se cifro con ella. Las rutas toman la primera.


def downgrade() -> None:
    for tabla in TABLAS + CONFIGS:
        op.drop_column(tabla, "user_id")
