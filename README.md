# Viernes

Aplicación full-stack con backend en FastAPI y dos frontends: **dashboard** (React) y **website** (Vue).

## Requisitos previos

- **Python 3.11+** → https://www.python.org/downloads/
- **Node.js 20+** → https://nodejs.org/
- **PostgreSQL 16** → https://www.postgresql.org/download/
- **Ollama** → https://ollama.com/download
- **Git** → https://git-scm.com/

---

## 1. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar (Windows)
.venv\Scripts\activate

# Activar (Mac/Linux)
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Variables de entorno — `backend/.env`

```env
# Base de datos
DATABASE_URL=postgresql+psycopg://usuario:contraseña@127.0.0.1:5432/viernes

# JWT
JWT_SECRET=cambiar_por_clave_segura
JWT_ALG=HS256
JWT_EXPIRES_MIN=43200

# CORS — frontends permitidos
CORS_ORIGINS=http://localhost:5173,http://localhost:4173

# IPs excluidas del conteo de visitas
EXCLUDED_IPS=127.0.0.1,::1

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_REASONING_MODEL=deepseek-r1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_VISION_MODEL=llava:7b
```

### Modelos de Ollama

```bash
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull nomic-embed-text
ollama pull llava:7b
```

### Migraciones y usuario inicial

```bash
# Aplicar migraciones
alembic upgrade head

# Crear usuario administrador (credenciales definidas en seed.py)
python seed.py
```

### Iniciar servidor

```bash
uvicorn main:app --reload --port 8000
```

API en `http://localhost:8000` — Docs en `http://localhost:8000/docs`

---

## 2. Frontend

Desde la raíz del monorepo instala todas las dependencias una sola vez:

```bash
npm install
```

### Dashboard (React) — `http://localhost:5173`

```bash
cd dashboard
npm run dev
```

### Website (Vue) — `http://localhost:4173`

```bash
cd website
npm run dev
```

Cambios en `packages/ui/src/` se reflejan en ambos frontends automáticamente.

---

### Variables de entorno — `dashboard/.env`

```env
VITE_API_URL=http://localhost:8000
```

### Variables de entorno — `website/.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## Migraciones (Alembic)

Con el entorno virtual activado desde `backend/`:

```bash
# Aplicar pendientes
alembic upgrade head

# Nueva migración tras cambiar modelos
alembic revision --autogenerate -m "descripcion"

# Ver estado actual
alembic current

# Ver historial
alembic history

# Revertir última
alembic downgrade -1
```

---

## Comandos rápidos

| Acción | Comando |
|---|---|
| Iniciar backend | `cd backend && uvicorn main:app --reload` |
| Aplicar migraciones | `alembic upgrade head` |
| Crear usuario admin | `python seed.py` |
| Iniciar dashboard | `cd dashboard && npm run dev` |
| Iniciar website | `cd website && npm run dev` |
