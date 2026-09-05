#!/usr/bin/env bash
# Despliegue de Viernes. Lo dispara deploy.timer cada minuto.
# Si no hay commits nuevos, sale sin hacer nada.
set -Eeuo pipefail

REPO=/var/www/viernes
RAMA=main
SERVICIO=viernes-backend
RESPALDOS=/var/backups/viernes
PY="$REPO/backend/.venv/bin/python"
ESTADO="$REPO/data/deploy_estado.json"

# Deja rastro de como acabo el deploy. Sin esto, un fallo bajo systemd es
# silencioso: el timer reintenta cada minuto y nadie se entera.
escribir_estado() {
  mkdir -p "$(dirname "$ESTADO")" 2>/dev/null || return 0
  printf '{"ok":%s,"commit":"%s","fecha":"%s","mensaje":"%s"}
'     "$1" "$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo desconocido)"     "$(date -Is)" "$2" > "$ESTADO" 2>/dev/null || true
}

trap 'escribir_estado false "fallo en la linea $LINENO"' ERR

cd "$REPO"

# Este script corre como el dueno del repo (no root): git necesita SU llave SSH.
# Lo unico privilegiado es el restart, via una regla de sudoers acotada.
if [ "$(id -u)" = "0" ]; then
  echo "No lo corras con sudo: root no tiene la llave SSH de GitHub."
  echo "Corrolo como $(stat -c %U "$REPO"): $0"
  exit 1
fi

# pg_dump necesita DATABASE_URL. NO usar `source`: las contrasenas con $ o
# backticks las expande bash y rompe. Lo lee el mismo parser que el backend.
if [ -z "${DATABASE_URL:-}" ] && [ -f "$REPO/backend/.env" ]; then
  DATABASE_URL=$("$PY" -c "import os;from dotenv import load_dotenv;load_dotenv(r'$REPO/backend/.env');print(os.getenv('DATABASE_URL',''))")
  export DATABASE_URL
fi

# systemd arranca con un PATH minimo y sin cargar ~/.bashrc, asi que node
# instalado con nvm no aparece. Lo buscamos antes de necesitarlo.
if ! command -v npm >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
fi
if ! command -v npm >/dev/null 2>&1; then
  for d in "$NVM_DIR"/versions/node/*/bin /usr/local/bin /usr/bin /opt/node/bin; do
    [ -x "$d/npm" ] && PATH="$d:$PATH" && break
  done
  export PATH
fi
if ! command -v npm >/dev/null 2>&1; then
  escribir_estado false "npm no encontrado en el PATH"
  echo "ABORTADO: no encuentro npm. Agrega su ruta al PATH del servicio:"
  echo "  systemctl edit viernes-deploy.service   ->   Environment=PATH=/ruta/a/node/bin:/usr/bin:/bin"
  exit 1
fi
echo "npm: $(command -v npm) ($(npm -v))"

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
    # Solo el cuerpo de upgrade(): el downgrade() casi siempre trae drops
    # y ahi son inofensivos, solo corren si pides revertir a mano.
    UPGRADE=$(git show "$REMOTO:$f" | sed -n '/^def upgrade/,/^def downgrade/p')
    if printf '%s' "$UPGRADE" | grep -qE 'op\.(drop_table|drop_column)\('; then
      if [ "${PERMITIR_DROPS:-0}" != "1" ]; then
        escribir_estado false "migracion con drops sin revisar: $f"
        echo "ABORTADO: $f contiene drop_table/drop_column."
        echo "Revísala a mano y corre: PERMITIR_DROPS=1 $0"
        exit 1
      fi
      echo "AVISO: $f tiene drops y PERMITIR_DROPS=1. Continuando."
    fi
  done
fi

# Bash lee el script por pedazos: si el pull lo reemplaza a media ejecucion,
# sigue leyendo el archivo nuevo desde el offset viejo y hace cualquier cosa.
# Por eso nos reejecutamos cuando el propio script cambio.
HASH_ANTES=$(sha1sum "$0" | cut -d" " -f1)

git merge --ff-only "origin/$RAMA"

if [ "$(sha1sum "$0" | cut -d" " -f1)" != "$HASH_ANTES" ] && [ "${REEJECUTADO:-0}" != "1" ]; then
  echo "El script cambio con este pull. Reejecutando la version nueva..."
  export REEJECUTADO=1 FORZAR=1
  exec "$0" "$@"
fi

# ── build ────────────────────────────────────────────────────────────────────
npm install
npm run build --workspace packages/ui   # primero: dashboard y website dependen de el
npm run build --workspace dashboard
npm run build --workspace website

# ── migraciones, siempre con respaldo antes ──────────────────────────────────
PENDIENTES=$(cd backend && "$PY" -m alembic heads | awk '{print $1}')
ACTUAL=$(cd backend && "$PY" -m alembic current 2>/dev/null | tail -1 | awk '{print $1}')
if [ "$PENDIENTES" != "$ACTUAL" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "ABORTADO: DATABASE_URL no esta definida y no se pudo leer de $REPO/backend/.env"
    echo "Sin ella no hay respaldo, y sin respaldo no se migra."
    exit 1
  fi
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
escribir_estado true "ok"
echo "=== Deploy OK: $(git rev-parse --short HEAD) ==="
