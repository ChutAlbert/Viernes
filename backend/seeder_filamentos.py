"""
Seeder masivo de filamentos.
Ejecutar desde /backend:
    python seeder_filamentos.py

Todos se crean con en_stock=False. Actívalos manualmente desde el dashboard.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.models.catalogo import CatalogoFilamento

FILAMENTOS = [
    # ── PLA  ($1.0/min) ───────────────────────────────────────────────────────
    ("PLA Blanco",         "PLA",      "#F5F5F5", 1.0),
    ("PLA Negro",          "PLA",      "#1A1A1A", 1.0),
    ("PLA Gris Claro",     "PLA",      "#B0BEC5", 1.0),
    ("PLA Gris Oscuro",    "PLA",      "#546E7A", 1.0),
    ("PLA Rojo",           "PLA",      "#E53E3E", 1.0),
    ("PLA Rojo Oscuro",    "PLA",      "#8B0000", 1.0),
    ("PLA Naranja",        "PLA",      "#E8721C", 1.0),
    ("PLA Naranja Claro",  "PLA",      "#FFA040", 1.0),
    ("PLA Amarillo",       "PLA",      "#F7DC6F", 1.0),
    ("PLA Amarillo Limón", "PLA",      "#FFF44F", 1.0),
    ("PLA Verde",          "PLA",      "#2D8A3E", 1.0),
    ("PLA Verde Lima",     "PLA",      "#7BC842", 1.0),
    ("PLA Verde Menta",    "PLA",      "#98D8C8", 1.0),
    ("PLA Verde Oliva",    "PLA",      "#808000", 1.0),
    ("PLA Azul Marino",    "PLA",      "#1E3A5F", 1.0),
    ("PLA Azul Real",      "PLA",      "#2255CC", 1.0),
    ("PLA Azul Cielo",     "PLA",      "#56B4E9", 1.0),
    ("PLA Turquesa",       "PLA",      "#00BCD4", 1.0),
    ("PLA Morado",         "PLA",      "#7B2D8B", 1.0),
    ("PLA Lila",           "PLA",      "#B39DDB", 1.0),
    ("PLA Rosa",           "PLA",      "#F48FB1", 1.0),
    ("PLA Rosa Chicle",    "PLA",      "#FF69B4", 1.0),
    ("PLA Café",           "PLA",      "#795548", 1.0),
    ("PLA Beige",          "PLA",      "#D7C5A3", 1.0),
    ("PLA Coral",          "PLA",      "#FF7F7F", 1.0),
    ("PLA Transparente",   "PLA",      "#D9EEF3", 1.0),

    # ── PLA+  ($1.2/min) ─────────────────────────────────────────────────────
    ("PLA+ Blanco",        "PLA+",     "#FFFFFF", 1.2),
    ("PLA+ Negro",         "PLA+",     "#111111", 1.2),
    ("PLA+ Gris",          "PLA+",     "#808080", 1.2),
    ("PLA+ Plateado",      "PLA+",     "#C0C0C0", 1.2),
    ("PLA+ Rojo",          "PLA+",     "#CC2222", 1.2),
    ("PLA+ Naranja",       "PLA+",     "#FF6600", 1.2),
    ("PLA+ Amarillo",      "PLA+",     "#FFD700", 1.2),
    ("PLA+ Verde",         "PLA+",     "#228B22", 1.2),
    ("PLA+ Verde Militar", "PLA+",     "#4A5D23", 1.2),
    ("PLA+ Azul Marino",   "PLA+",     "#1A3A6B", 1.2),
    ("PLA+ Azul Real",     "PLA+",     "#1A4FD6", 1.2),
    ("PLA+ Turquesa",      "PLA+",     "#00CED1", 1.2),
    ("PLA+ Morado",        "PLA+",     "#6A0DAD", 1.2),
    ("PLA+ Rosa",          "PLA+",     "#FF1493", 1.2),
    ("PLA+ Dorado",        "PLA+",     "#DAA520", 1.2),
    ("PLA+ Café",          "PLA+",     "#6D4C41", 1.2),

    # ── PETG  ($1.5/min) ─────────────────────────────────────────────────────
    ("PETG Transparente",  "PETG",     "#D4EEF7", 1.5),
    ("PETG Natural",       "PETG",     "#F5E6CC", 1.5),
    ("PETG Blanco",        "PETG",     "#F0F0F0", 1.5),
    ("PETG Negro",         "PETG",     "#0D0D0D", 1.5),
    ("PETG Gris",          "PETG",     "#607D8B", 1.5),
    ("PETG Rojo",          "PETG",     "#B22222", 1.5),
    ("PETG Naranja",       "PETG",     "#E65100", 1.5),
    ("PETG Amarillo",      "PETG",     "#F9A825", 1.5),
    ("PETG Verde",         "PETG",     "#1B5E20", 1.5),
    ("PETG Azul",          "PETG",     "#1565C0", 1.5),
    ("PETG Turquesa",      "PETG",     "#00838F", 1.5),
    ("PETG Morado",        "PETG",     "#4A148C", 1.5),
    ("PETG Rosa",          "PETG",     "#AD1457", 1.5),

    # ── PLA Silk  ($1.8/min) ─────────────────────────────────────────────────
    ("PLA Silk Dorado",         "PLA Silk", "#CFB53B", 1.8),
    ("PLA Silk Plateado",       "PLA Silk", "#B8C4CC", 1.8),
    ("PLA Silk Cobre",          "PLA Silk", "#B87333", 1.8),
    ("PLA Silk Bronce",         "PLA Silk", "#CD7F32", 1.8),
    ("PLA Silk Rojo Vino",      "PLA Silk", "#722F37", 1.8),
    ("PLA Silk Rojo",           "PLA Silk", "#C0392B", 1.8),
    ("PLA Silk Naranja",        "PLA Silk", "#E67E22", 1.8),
    ("PLA Silk Champagne",      "PLA Silk", "#F7E7CE", 1.8),
    ("PLA Silk Azul Zafiro",    "PLA Silk", "#0F52BA", 1.8),
    ("PLA Silk Azul Royal",     "PLA Silk", "#4169E1", 1.8),
    ("PLA Silk Verde Esmeralda","PLA Silk", "#006B3C", 1.8),
    ("PLA Silk Verde Jade",     "PLA Silk", "#00A36C", 1.8),
    ("PLA Silk Morado",         "PLA Silk", "#7B2FBE", 1.8),
    ("PLA Silk Rosa",           "PLA Silk", "#FF69B4", 1.8),
    ("PLA Silk Negro",          "PLA Silk", "#1C1C1C", 1.8),
    ("PLA Silk Blanco Perla",   "PLA Silk", "#F0EAD6", 1.8),
    ("PLA Silk Arcoíris",       "PLA Silk", "#FF6B6B", 1.8),
]


def run():
    db = SessionLocal()
    try:
        existentes = {f.nombre for f in db.query(CatalogoFilamento.nombre).all()}
        nuevos = 0
        for nombre, tipo, hex_cod, tarifa in FILAMENTOS:
            if nombre in existentes:
                print(f"  skip  {nombre}")
                continue
            db.add(CatalogoFilamento(
                nombre=nombre,
                tipo_material=tipo,
                hex_codigo=hex_cod,
                tarifa_por_minuto=tarifa,
                en_stock=False,
                activo=True,
            ))
            nuevos += 1
            print(f"  +  {nombre}")
        db.commit()
        print(f"\n✓ {nuevos} filamentos insertados ({len(FILAMENTOS) - nuevos} ya existían).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
