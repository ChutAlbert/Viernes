# Viernes — Guía de instalación y puesta en marcha

## Requisitos previos

1. **Docker Desktop** → https://www.docker.com/products/docker-desktop/
   - Windows: habilitar WSL 2 durante la instalación
   - Verificar: `docker --version` y `docker compose version`

2. **Ollama** (corre en el host, fuera de Docker) → https://ollama.com/download
   - Verificar: `ollama --version`

3. **Git** → https://git-scm.com/

---

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd Viernes
```

---

## 2. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto (junto a `docker-compose.yml`):

```env
# Base de datos
POSTGRES_USER=viernes
POSTGRES_PASSWORD=viernes
POSTGRES_DB=viernes

# Backend
SECRET_KEY=cambiar_por_clave_segura

# Ollama — modelos (deben estar descargados en Ollama)
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_REASONING_MODEL=deepseek-r1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_VISION_MODEL=llava:7b

# Dashboard
VITE_API_URL=http://localhost:8000
```

---

## 3. Descargar modelos en Ollama

```bash
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull nomic-embed-text
ollama pull llava:7b
```

---

## 4. Levantar los servicios

```bash
docker compose up --build
```

Primera vez tarda unos minutos en construir las imágenes.

Servicios disponibles:
| Servicio    | URL                    |
|-------------|------------------------|
| Dashboard   | http://localhost:5173  |
| Backend API | http://localhost:8000  |
| API Docs    | http://localhost:8000/docs |
| PostgreSQL  | localhost:5432         |
| Website     | http://localhost:4173  |

---

## 5. Migraciones y usuario inicial

En otra terminal, con los contenedores corriendo:

```bash
# Crear tablas en la base de datos
docker exec viernes_backend alembic upgrade head

# Crear usuario por defecto
docker exec viernes_backend python seed.py
```

Usuario creado:
- **Email:** `jesus@gmail.com`
- **Password:** `viernes123`

---

## Comandos útiles del día a día

```bash
# Levantar en segundo plano
docker compose up -d

# Levantar y reconstruir imágenes (después de cambiar Dockerfile o requirements)
docker compose up --build

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f dashboard

# Parar los servicios
docker compose down

# Parar y borrar volúmenes (BORRA la base de datos)
docker compose down -v

# Reiniciar un servicio
docker compose restart backend
```

## Migraciones de base de datos (Alembic)

```bash
# Aplicar migraciones pendientes
docker exec viernes_backend alembic upgrade head

# Crear nueva migración tras cambiar modelos
docker exec viernes_backend alembic revision --autogenerate -m "descripcion"

# Ver estado actual
docker exec viernes_backend alembic current

# Revertir última migración
docker exec viernes_backend alembic downgrade -1
```

---

## Desarrollo — hot reload

El código se monta como volumen, no hace falta reconstruir la imagen al editar archivos:

- `backend/` → uvicorn recarga automáticamente
- `dashboard/src/` → Vite HMR
- `website/src/` → Vite HMR
- `packages/ui/src/` → Vite HMR (compartido entre dashboard y website)

Solo reconstruir con `--build` cuando cambies:
- `Dockerfile` de cualquier servicio
- `requirements.txt`
- `package.json` (dependencias nuevas)
