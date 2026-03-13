"""
pokemon_go_indexer.py
Script para descargar datos de Pokémon GO desde APIs gratuitas
e indexarlos en ChromaDB para que Viernes los tenga disponibles.

Uso:
    cd D:\Viernes\backend
    .venv\Scripts\activate
    python pokemon_go_indexer.py

APIs usadas (gratuitas, sin API key):
    - pogoapi.net  → stats GO, moves, tipos, pokemon por tipo
    - pokeapi.co   → efectividad de tipos, evoluciones
"""

import requests
import json
import sys
import os
from pathlib import Path

# Agregar el backend al path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.rag_service import RagService

rag = RagService()

POGOAPI = "https://pogoapi.net/api/v1"
NAMESPACE = "pokemon_go"

# ─── helpers ─────────────────────────────────────────────────────────────────

def fetch(url: str) -> dict | list | None:
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  ⚠ Error fetcheando {url}: {e}")
        return None

def upsert(doc_id: str, text: str, extra_meta: dict = {}):
    rag.upsert_text(
        doc_id=doc_id,
        text=text,
        metadata={"namespace": NAMESPACE, **extra_meta}
    )
    print(f"  ✓ {doc_id}")


# ─── 1. Stats base ────────────────────────────────────────────────────────────

def index_pokemon_stats():
    print("\n📊 Indexando stats base de Pokémon GO...")
    data = fetch(f"{POGOAPI}/pokemon_stats.json")
    if not data:
        return

    # Agrupar por pokemon_id para juntar formas
    pokemon_map = {}
    for p in data:
        pid = p["pokemon_id"]
        if pid not in pokemon_map:
            pokemon_map[pid] = {
                "name": p["pokemon_name"],
                "id": pid,
                "forms": []
            }
        pokemon_map[pid]["forms"].append({
            "form": p.get("form", "Normal"),
            "attack": p["base_attack"],
            "defense": p["base_defense"],
            "stamina": p["base_stamina"],
        })

    # Indexar en lotes de 50 para no saturar ChromaDB
    batch = []
    for pid, poke in pokemon_map.items():
        forms_text = ""
        for f in poke["forms"]:
            forms_text += (
                f"\n  Forma {f['form']}: "
                f"Ataque={f['attack']}, Defensa={f['defense']}, Stamina={f['stamina']}"
            )

        text = (
            f"Pokémon GO - Stats de {poke['name']} (#{poke['id']}):\n"
            f"{forms_text}\n"
            f"El CP máximo estimado depende del nivel del entrenador y los IVs."
        )
        batch.append((f"pogo::stats::{pid}", text, {"pokemon": poke['name'], "pokemon_id": pid}))

        if len(batch) >= 50:
            for doc_id, t, meta in batch:
                upsert(doc_id, t, meta)
            batch = []

    for doc_id, t, meta in batch:
        upsert(doc_id, t, meta)

    print(f"  ✅ {len(pokemon_map)} Pokémon indexados")


# ─── 2. Moves rápidos ─────────────────────────────────────────────────────────

def index_fast_moves():
    print("\n⚡ Indexando fast moves...")
    data = fetch(f"{POGOAPI}/fast_moves.json")
    if not data:
        return

    # Agrupar por tipo para un documento por tipo
    by_type = {}
    for move in data:
        t = move.get("type", "Unknown")
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(move)

    for tipo, moves in by_type.items():
        lines = [f"Moves rápidos de tipo {tipo} en Pokémon GO:\n"]
        for m in moves:
            lines.append(
                f"- {m['name']}: "
                f"Daño={m['power']}, "
                f"Energía={m['energy_delta']}, "
                f"Duración={m['duration']}ms"
            )
        upsert(f"pogo::fast_moves::{tipo.lower()}", "\n".join(lines), {"type": tipo})

    # También un documento con todos los moves juntos para búsqueda general
    all_lines = ["Todos los fast moves en Pokémon GO:\n"]
    for move in sorted(data, key=lambda x: x['name']):
        all_lines.append(
            f"- {move['name']} (tipo {move['type']}): "
            f"Daño={move['power']}, Energía={move['energy_delta']}"
        )
    upsert("pogo::fast_moves::all", "\n".join(all_lines))

    print(f"  ✅ {len(data)} fast moves indexados")


# ─── 3. Charged moves ─────────────────────────────────────────────────────────

def index_charged_moves():
    print("\n💥 Indexando charged moves...")
    data = fetch(f"{POGOAPI}/charged_moves.json")
    if not data:
        return

    by_type = {}
    for move in data:
        t = move.get("type", "Unknown")
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(move)

    for tipo, moves in by_type.items():
        lines = [f"Moves cargados (charged) de tipo {tipo} en Pokémon GO:\n"]
        for m in moves:
            lines.append(
                f"- {m['name']}: "
                f"Daño={m['power']}, "
                f"Energía={m.get('energy_delta', '?')}, "
                f"Duración={m['duration']}ms"
            )
        upsert(f"pogo::charged_moves::{tipo.lower()}", "\n".join(lines), {"type": tipo})

    all_lines = ["Todos los charged moves en Pokémon GO:\n"]
    for move in sorted(data, key=lambda x: x['name']):
        all_lines.append(
            f"- {move['name']} (tipo {move['type']}): "
            f"Daño={move['power']}, Energía={move.get('energy_delta', '?')}"
        )
    upsert("pogo::charged_moves::all", "\n".join(all_lines))

    print(f"  ✅ {len(data)} charged moves indexados")


# ─── 4. Pokémon por tipo ──────────────────────────────────────────────────────

def index_pokemon_by_type():
    print("\n🔥 Indexando Pokémon por tipo...")
    data = fetch(f"{POGOAPI}/pokemon_types.json")
    if not data:
        return

    # data es lista: [{pokemon_name, form, type_1, type_2, pokemon_id}]
    by_type = {}
    for p in data:
        for t_key in ["type_1", "type_2"]:
            t = p.get(t_key)
            if t:
                if t not in by_type:
                    by_type[t] = []
                name = p["pokemon_name"]
                if p.get("form") and p["form"] not in ("Normal", ""):
                    name += f" ({p['form']})"
                if name not in by_type[t]:
                    by_type[t].append(name)

    for tipo, pokemon_list in by_type.items():
        text = (
            f"Pokémon de tipo {tipo} en Pokémon GO:\n"
            + ", ".join(sorted(set(pokemon_list)))
        )
        upsert(f"pogo::type_pokemon::{tipo.lower()}", text, {"type": tipo})

    print(f"  ✅ {len(by_type)} tipos indexados")


# ─── 5. Efectividad de tipos ──────────────────────────────────────────────────

def index_type_effectiveness():
    print("\n⚔️  Indexando efectividad de tipos...")

    # Tabla de efectividad de tipos Pokémon GO
    # (ligeramente diferente a los juegos principales por los multiplicadores de GO)
    effectiveness = {
        "Normal":   {"weak": ["Fighting"], "resistant": ["Ghost"], "immune": []},
        "Fire":     {"weak": ["Water","Rock","Ground"], "resistant": ["Fire","Grass","Ice","Bug","Steel","Fairy"], "immune": []},
        "Water":    {"weak": ["Electric","Grass"], "resistant": ["Fire","Water","Ice","Steel"], "immune": []},
        "Electric": {"weak": ["Ground"], "resistant": ["Electric","Flying","Steel"], "immune": []},
        "Grass":    {"weak": ["Fire","Ice","Poison","Flying","Bug"], "resistant": ["Water","Electric","Grass","Ground"], "immune": []},
        "Ice":      {"weak": ["Fire","Fighting","Rock","Steel"], "resistant": ["Ice"], "immune": []},
        "Fighting": {"weak": ["Flying","Psychic","Fairy"], "resistant": ["Bug","Rock","Dark"], "immune": []},
        "Poison":   {"weak": ["Ground","Psychic"], "resistant": ["Grass","Fighting","Poison","Bug","Fairy"], "immune": []},
        "Ground":   {"weak": ["Water","Grass","Ice"], "resistant": ["Poison","Rock"], "immune": ["Electric"]},
        "Flying":   {"weak": ["Electric","Ice","Rock"], "resistant": ["Grass","Fighting","Bug"], "immune": ["Ground"]},
        "Psychic":  {"weak": ["Bug","Ghost","Dark"], "resistant": ["Fighting","Psychic"], "immune": []},
        "Bug":      {"weak": ["Fire","Flying","Rock"], "resistant": ["Grass","Fighting","Ground"], "immune": []},
        "Rock":     {"weak": ["Water","Grass","Fighting","Ground","Steel"], "resistant": ["Normal","Fire","Poison","Flying"], "immune": []},
        "Ghost":    {"weak": ["Ghost","Dark"], "resistant": ["Poison","Bug"], "immune": ["Normal","Fighting"]},
        "Dragon":   {"weak": ["Ice","Dragon","Fairy"], "resistant": ["Fire","Water","Electric","Grass"], "immune": []},
        "Dark":     {"weak": ["Fighting","Bug","Fairy"], "resistant": ["Ghost","Dark"], "immune": ["Psychic"]},
        "Steel":    {"weak": ["Fire","Fighting","Ground"], "resistant": ["Normal","Grass","Ice","Flying","Psychic","Bug","Rock","Dragon","Steel","Fairy"], "immune": ["Poison"]},
        "Fairy":    {"weak": ["Poison","Steel"], "resistant": ["Fighting","Bug","Dark"], "immune": ["Dragon"]},
    }

    for tipo, info in effectiveness.items():
        text = (
            f"Efectividad de tipos contra Pokémon de tipo {tipo} en Pokémon GO:\n"
            f"- Débil contra (recibe 1.6x): {', '.join(info['weak']) or 'ninguno'}\n"
            f"- Resistente a (recibe 0.625x): {', '.join(info['resistant']) or 'ninguno'}\n"
            f"- Inmune a (recibe 0.390x en GO): {', '.join(info['immune']) or 'ninguno'}\n\n"
            f"Para atacar con tipo {tipo}:\n"
            f"Los ataques de tipo {tipo} son super efectivos (1.6x) contra los tipos que {tipo} tiene ventaja."
        )
        upsert(f"pogo::effectiveness::{tipo.lower()}", text, {"type": tipo})

    print(f"  ✅ {len(effectiveness)} tipos de efectividad indexados")


# ─── 6. Mejores atacantes por tipo ───────────────────────────────────────────

def index_best_attackers():
    print("\n🏆 Indexando mejores atacantes por tipo...")

    # Top atacantes por tipo (basado en DPS/TDO conocidos)
    # Datos actualizados a 2025
    best_attackers = {
        "Fire": [
            "Mega Blaziken", "Shadow Moltres", "Reshiram", "Shadow Charizard",
            "Mega Charizard Y", "Chandelure", "Darmanitan (Standard)"
        ],
        "Water": [
            "Mega Swampert", "Shadow Kyogre", "Kyogre", "Shadow Kingler",
            "Mega Blastoise", "Feraligatr (Shadow)", "Waterfall Gyarados"
        ],
        "Electric": [
            "Shadow Raikou", "Mega Manectric", "Xurkitree", "Zekrom",
            "Shadow Electivire", "Thundurus (Therian)", "Mega Ampharos"
        ],
        "Grass": [
            "Mega Sceptile", "Shadow Torterra", "Kartana", "Roserade (Shadow)",
            "Shadow Tangrowth", "Zarude", "Chesnaught"
        ],
        "Ice": [
            "Shadow Mamoswine", "Galarian Darmanitan", "Baxcalibur",
            "Mamoswine", "Shadow Glaceon", "Kyurem", "Mega Abomasnow"
        ],
        "Dragon": [
            "Shadow Salamence", "Mega Rayquaza", "Shadow Dragonite",
            "Palkia (Origin)", "Dialga (Origin)", "Roaring Moon", "Rayquaza"
        ],
        "Psychic": [
            "Shadow Mewtwo", "Mewtwo", "Mega Mewtwo X/Y", "Hoopa (Unbound)",
            "Shadow Espeon", "Gallade (Shadow)", "Mega Latios"
        ],
        "Fighting": [
            "Shadow Machamp", "Mega Lopunny", "Terrakion", "Keldeo",
            "Shadow Hariyama", "Lucario", "Conkeldurr"
        ],
        "Rock": [
            "Shadow Rhyperior", "Mega Diancie", "Rampardos",
            "Shadow Tyranitar", "Mega Aerodactyl", "Nihilego", "Lycanroc (Dusk)"
        ],
        "Ground": [
            "Shadow Excadrill", "Primal Groudon", "Garchomp",
            "Shadow Mamoswine", "Landorus (Therian)", "Shadow Golem", "Rhyperior"
        ],
        "Ghost": [
            "Shadow Gengar", "Mega Gengar", "Giratina (Origin)",
            "Chandelure (Shadow)", "Hoopa (Unbound)", "Dragapult", "Lunala"
        ],
        "Dark": [
            "Shadow Tyranitar", "Mega Tyranitar", "Hydreigon",
            "Darkrai", "Shadow Weavile", "Yveltal", "Mega Houndoom"
        ],
        "Steel": [
            "Shadow Metagross", "Mega Metagross (no existe, usa normal)", "Metagross",
            "Dialga", "Excadrill (Shadow)", "Empoleon (Shadow)", "Kartana"
        ],
        "Fairy": [
            "Shadow Gardevoir", "Mega Gardevoir", "Togekiss (Shadow)",
            "Xerneas", "Zacian", "Primarina", "Sylveon"
        ],
        "Flying": [
            "Shadow Moltres", "Mega Rayquaza", "Honchkrow (Shadow)",
            "Staraptor (Shadow)", "Yveltal", "Mega Pidgeot", "Braviary"
        ],
        "Poison": [
            "Shadow Roserade", "Mega Beedrill", "Nihilego",
            "Salazzle", "Victreebel (Shadow)", "Toxicroak (Shadow)", "Gengar"
        ],
        "Bug": [
            "Mega Pinsir", "Shadow Scizor", "Genesect",
            "Pheromosa", "Escavalier (Shadow)", "Yanmega (Shadow)", "Volcarona"
        ],
        "Normal": [
            "Mega Pidgeot (para ataques normales)", "Blissey (defensiva)",
            "Snorlax (defensiva)", "Slaking"
        ],
    }

    for tipo, attackers in best_attackers.items():
        text = (
            f"Mejores atacantes de tipo {tipo} en Pokémon GO (ordenados por DPS/TDO):\n"
            + "\n".join(f"{i+1}. {a}" for i, a in enumerate(attackers))
            + f"\n\nNota: Los Shadow Pokémon tienen +20% de ataque pero -20% de defensa. "
            f"Los Mega tienen el mayor DPS pero requieren Mega Energía."
        )
        upsert(f"pogo::best_attackers::{tipo.lower()}", text, {"type": tipo})

    print(f"  ✅ {len(best_attackers)} tipos de atacantes indexados")


# ─── 7. Guía general de raids ─────────────────────────────────────────────────

def index_raid_guide():
    print("\n🥊 Indexando guía de raids...")

    text = """Guía de raids en Pokémon GO:

Niveles de raid:
- Estrella 1: Fácil, solo. Pokémon comunes.
- Estrella 3: Medio, 2-3 entrenadores recomendados.
- Estrella 5: Legendarios, mínimo 5-8 entrenadores según el Pokémon.
- Mega Raid: Requiere Mega Energía, muy fuerte. 4-6 entrenadores.
- Elite Raid: Solo presencial, muy difícil.

Mecánicas clave:
- El clima aumenta 20% el daño de tipos afines y mejora IVs de captura.
- Los Shadow Pokémon hacen 20% más daño en raids.
- Usar types super efectivos es fundamental.
- El tiempo límite es 300 segundos para raids T5.

Mejores counters generales:
- Mewtwo (Psycho Cut + Psystrike) para casi todo
- Machamp/Conkeldurr para tipos Normal, Rock, Dark, Steel, Ice
- Kyogre (Waterfall + Surf) para Fire, Ground, Rock
- Rayquaza (Dragon Tail + Outrage) para Dragon, Flying

IVs en raids:
- Clima boosted: mínimo 10/10/10 (82.2%)
- Sin clima: mínimo 10/10/10 garantizado solo con clima boost, sin boost puede bajar a 10/10/10
- IV perfecto (100%): 15/15/15
- Para uso competitivo PvE: cualquier IV ≥82% es suficiente
- Para PvP Great/Ultra League: los IVs bajos de ataque son MEJORES para el CP máximo permitido
"""
    upsert("pogo::raid_guide", text)
    print("  ✅ Guía de raids indexada")


# ─── main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("🎮 Pokémon GO Indexer para Viernes")
    print("=" * 60)

    index_pokemon_stats()
    index_fast_moves()
    index_charged_moves()
    index_pokemon_by_type()
    index_type_effectiveness()
    index_best_attackers()
    index_raid_guide()

    print("\n" + "=" * 60)
    print("✅ ¡Listo! Viernes ahora tiene toda la info de Pokémon GO.")
    print("Prueba preguntarle:")
    print("  - '¿Cuáles son las stats de Dragonite en Pokémon GO?'")
    print("  - '¿Cuál es el mejor counter para raids de tipo Fuego?'")
    print("  - '¿Qué charged moves de tipo Agua existen?'")
    print("=" * 60)


if __name__ == "__main__":
    main()