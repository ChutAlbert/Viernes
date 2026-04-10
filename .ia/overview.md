# Viernes — Visión general del proyecto

## Qué es
Aplicación full-stack con:
- **Sitio público** (Vue) — marketing / landing page
- **Dashboard admin** (React) — panel interno con chat IA, documentos, Gmail, CMS
- **Backend** (FastAPI) — APIs para todo lo anterior
- **Paquete UI** — componentes compartidos entre Vue y React

## Puertos en desarrollo

| Servicio | Puerto |
|---|---|
| Backend API | `http://localhost:8000` |
| Dashboard (React) | `http://localhost:5173` |
| Website (Vue) | `http://localhost:5174` |

## Estructura del monorepo

```
Viernes/
├── backend/        # FastAPI + PostgreSQL + Ollama + ChromaDB
├── dashboard/      # React admin (chat, docs, Gmail, CMS)
├── website/        # Vue sitio público
├── packages/ui/    # Componentes React + Vue compartidos
├── data/           # Archivos en runtime (docs, images, vectordb)
│   ├── docs/       # PDFs subidos
│   ├── images/     # Imágenes procesadas
│   └── vectordb/   # ChromaDB (embeddings RAG)
├── .env            # Variables de entorno
└── package.json    # Monorepo root (npm workspaces)
```

## Archivos de esta carpeta

| Archivo | Descripción |
|---|---|
| [overview.md](overview.md) | Este archivo — visión general |
| [backend.md](backend.md) | Estructura, modelos, servicios y todos los endpoints |
| [dashboard.md](dashboard.md) | Páginas, rutas, componentes y features del admin |
| [website.md](website.md) | Vistas, rutas y secciones del sitio público |
| [ui.md](ui.md) | Componentes compartidos React + Vue |

## Features IA del sistema
- **Chat con streaming** usando Ollama (local, sin cloud)
- **Loop ReAct** — el modelo decide cuándo buscar en web, razonar, o responder
- **RAG** — documentos → ChromaDB → búsqueda semántica → contexto en prompts
- **Modelos usados:**
  - `qwen3:8b` — chat general
  - `deepseek-r1:8b` — razonamiento complejo
  - `nomic-embed-text` — embeddings
  - `llava:7b` — OCR / visión

## Base de datos
PostgreSQL con estas tablas principales:
- `users` — autenticación
- `chat_sessions` + `chat_messages` — historial de chat
- `memory_items` — contexto/memoria por usuario
- `session_links` — relaciones entre sesiones
- `website_*` — datos del CMS (servicios, contactos, miembros, settings)
