#!/usr/bin/env bash
# Despliegue de Viernes. Lo dispara deploy.timer cada minuto.
# Si no hay commits nuevos, sale sin hacer nada.
set -euo pipefail

REPO=/var/www/viernes
RAMA=main
SERVICIO=viernes-backend
RESPALDOS=/var/backups/viernes
PY="$REPO/backend/.venv/bin/python"

cd "$REPO"

# Este script corre como el dueno del repo (no root): git necesita SU llave SSH.
# Lo unico privilegiado es el restart, via una regla de sudoers acotada.
if [ "$(id -u)" = "0" ]; then
  echo "No lo corras con sudo: root no tiene la llave SSH de GitHub."
  echo "Corrolo como $(stat -c %U "$REPO"): $0"
  exit 1
fi

# pg_dump necesita DATABASE_URL. systemd la pasa por EnvironmentFile,
# pero en una corrida manual hay que leerla del .env.
if [ -z "${DATABASE_URL:-}" ] && [ -f "$REPO/backend/.env" ]; then
  set -a; . "$REPO/backend/.env"; set +a
fi

# ── ¿hay algo nuevo? ─────────────────────────────────────────────────────────
git fetch --quiet origin "$RAMA"
LOCAL=$(git rev-parse HEAD)
REMOTO=$(git rev-parse "origin/$RAMA")
# FORZAR=1 despliega aunque no haya commits nuevos: instalacion inicial,
# cambios en .env, o rehacer un build que quedo a medias.
if [ "$LOCAL" = "$REMOTO" ] && [ "${FORZAR:-0}" != "1" ]; then
  exit 0
fi

echo "=== Deploy $(date -Is): $LOCAL -> $REMOTO ==="

# ── candado anti-migraciones destructivas ────────────────────────────────────
# Busca drop_table / drop_column en las migraciones que llegan con este pull.
NUEVAS=$(git diff --name-only --diff-filter=A "$LOCAL" "$REMOTO" -- backend/alembic/versions/ || true)
if [ -n "$NUEVAS" ]; then
  for f in $NUEVAS; do
    if git show "$REMOTO:$f" | grep -qE '\bop\.(drop_table|drop_column)\('; then
      if [ "${PERMITIR_DROPS:-0}" != "1" ]; then
        echo "ABORTADO: $f contiene drop_table/drop_column."
        echo "Revísala a mano y corre: PERMITIR_DROPS=1 $0"
        exit 1
      fi
      echo "AVISO: $f tiene drops y PERMITIR_DROPS=1. Continuando."
    fi
  done
fi

git merge --ff-only "origin/$RAMA"

# ── build ────────────────────────────────────────────────────────────────────
npm install
npm run build --workspace packages/ui   # primero: dashboard y website dependen de el
npm run build --workspace dashboard
npm run build --workspace website

# ── migraciones, siempre con respaldo antes ──────────────────────────────────
PENDIENTES=$(cd backend && "$PY" -m alembic heads | awk '{print $1}')
ACTUAL=$(cd backend && "$PY" -m alembic current 2>/dev/null | tail -1 | awk '{print $1}')
if [ "$PENDIENTES" != "$ACTUAL" ]; then
  mkdir -p "$RESPALDOS"
  DUMP="$RESPALDOS/viernes-$(date +%Y%m%d-%H%M%S).sql"
  echo "Respaldando en $DUMP"
  # SQLAlchemy usa postgresql+psycopg://; pg_dump solo entiende postgresql://
  URL_DUMP=$(echo "$DATABASE_URL" | sed -E 's#^postgresql\+[a-z0-9]+://#postgresql://#')
  pg_dump "$URL_DUMP" > "$DUMP"            # si falla, set -e aborta y NO migra
  gzip "$DUMP"
  ( cd backend && "$PY" -m alembic upgrade head )
else
  echo "Sin migraciones pendientes."
fi

# ── reiniciar backend al final ───────────────────────────────────────────────
sudo -n /usr/bin/systemctl restart "$SERVICIO"
echo "=== Deploy OK: $(git rev-parse --short HEAD) ==="
