"""Unifica redes_sociales dentro de website_contacts

Escrita a mano (sin autogenerate).
Aditiva: agrega 3 columnas y COPIA las redes. No borra redes_sociales.

Revision ID: c4d82f1a9b30
Revises: b3e17c9042aa
"""
from alembic import op
import sqlalchemy as sa

revision = "c4d82f1a9b30"
down_revision = "b3e17c9042aa"
branch_labels = None
depends_on = None

# icono de redes_sociales -> contact_type unificado
_MAPA_TIPO = {
    "whatsapp": "whatsapp", "instagram": "instagram", "facebook": "facebook",
    "tiktok": "tiktok", "x": "x", "youtube": "youtube",
    "linkedin": "linkedin", "telegram": "telegram", "website": "other",
}


def upgrade() -> None:
    op.add_column("website_contacts", sa.Column("es_red", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("website_contacts", sa.Column("es_contacto", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("website_contacts", sa.Column("orden", sa.Integer(), nullable=False, server_default="0"))

    conn = op.get_bind()
    if not conn.dialect.has_table(conn, "redes_sociales"):
        return

    filas = conn.execute(sa.text(
        "SELECT nombre, url, icono, orden, activo FROM redes_sociales"
    )).fetchall()

    for nombre, url, icono, orden, activo in filas:
        tipo = _MAPA_TIPO.get((icono or "").lower(), "other")
        if "whats" in (nombre or "").lower():
            tipo = "whatsapp"
        # WhatsApp sirve como red y como contacto; el resto solo como red
        es_contacto = tipo == "whatsapp"
        conn.execute(
            sa.text(
                "INSERT INTO website_contacts "
                "(contact_type, label, value, is_active, areas, es_red, es_contacto, orden) "
                "VALUES (:t, :l, :v, :a, :ar, true, :ec, :o)"
            ),
            {"t": tipo, "l": nombre, "v": url, "a": bool(activo),
             "ar": "software,impresion3d", "ec": es_contacto, "o": orden or 0},
        )


def downgrade() -> None:
    # borra solo lo que este upgrade insertó
    op.get_bind().execute(sa.text("DELETE FROM website_contacts WHERE es_red = true"))
    op.drop_column("website_contacts", "orden")
    op.drop_column("website_contacts", "es_contacto")
    op.drop_column("website_contacts", "es_red")
