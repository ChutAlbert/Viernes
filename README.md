# Viernes

Aplicación full-stack con backend en FastAPI y dos frontends: **dashboard** (React) y **website** (Vue).

## Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL
- [Ollama](https://ollama.com/) corriendo localmente

## 1. Backend (FastAPI)

### Instalar dependencias

```bash
cd backend
python -m venv .venv

# Activar en Windows (PowerShell/CMD):
.venv\Scripts\activate

# Activar en bash/Git Bash:
source .venv/Scripts/activate

pip install -r requirements.txt
```

### Configurar variables de entorno

Crea el archivo `backend/.env` con el siguiente contenido:

```env
DATABASE_URL=postgresql+psycopg://postgres:local@127.0.0.1:5432/viernes

JWT_SECRET=tu_secreto_aqui
JWT_ALG=HS256
JWT_EXPIRES_MIN=43200

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_REASONING_MODEL=deepseek-r1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_VISION_MODEL=llava:7b
```

### Modelos de Ollama requeridos

```bash
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull nomic-embed-text
ollama pull llava:7b
```

### Correr migraciones

```bash
cd backend
.venv/Scripts/alembic upgrade head
```

### Crear usuario inicial

```bash
cd backend
python seed.py
```

Crea el usuario por defecto:
- **Email:** jesus@gmail.com
- **Password:** viernes123

### Iniciar el servidor

```bash
cd backend
uvicorn main:app --reload
```

El backend corre en `http://localhost:8000`.

---

## 2. Frontend — Dashboard (React)

```bash
# Desde la raíz del proyecto
npm install
npm run dev --workspace=dashboard
```

Corre en `http://localhost:5173`.

---

## 3. Frontend — Website (Vue)

```bash
# Desde la raíz del proyecto
npm install  # si no lo hiciste antes
npm run dev --workspace=website
```

Corre en `http://localhost:4173`.

---

## Comandos útiles

| Acción | Comando |
|---|---|
| Iniciar backend | `cd backend && uvicorn main:app --reload` |
| Aplicar migraciones | `cd backend && .venv/Scripts/alembic upgrade head` |
| Crear usuario inicial | `cd backend && python seed.py` |
| Crear migración | `cd backend && .venv/Scripts/alembic revision --autogenerate -m "descripcion"` |
| Ver migración actual | `cd backend && .venv/Scripts/alembic current` |
| Iniciar dashboard | `npm run dev --workspace=dashboard` |
| Iniciar website | `npm run dev --workspace=website` |
