# Backend — FastAPI (Python)

**Ubicación:** `backend/`
**Entry point:** `backend/main.py`
**Corre en:** `http://localhost:8000`

## Stack
- FastAPI + Uvicorn
- PostgreSQL + SQLAlchemy 2.0 + Alembic (migraciones)
- JWT auth (python-jose, passlib/bcrypt)
- Ollama (LLM local), ChromaDB (vector DB), sentence-transformers
- Gmail API (OAuth), DuckDuckGo search

## Estructura

```
backend/
├── main.py                  # App init, CORS, warm-up de modelos, static files
├── seed.py                  # Crea usuario inicial (jesus@gmail.com / viernes123)
├── requirements.txt
├── alembic/                 # 6 archivos de migración
└── app/
    ├── core/
    │   ├── config.py        # Paths, URLs de Ollama, nombres de modelos
    │   ├── deps.py          # Dependency injection: get_db, get_current_user
    │   └── security.py      # JWT create/verify, hashing de passwords
    ├── db.py                # SessionFactory, Base de SQLAlchemy
    ├── models/              # ORM models (SQLAlchemy)
    ├── schemas/             # Pydantic request/response models
    ├── routes/              # Handlers de endpoints
    └── services/            # Lógica de negocio
```

## Modelos (base de datos)

| Archivo | Tabla | Campos clave |
|---|---|---|
| `user.py` | users | id, email, password_hash, is_active |
| `chat_sessions.py` | chat_sessions | id, title, created_at, user_id |
| `chat_messages.py` | chat_messages | id, session_id, role, content, created_at |
| `memory_items.py` | memory_items | user_id, source, source_id, text, embedding, topic |
| `session_links.py` | session_links | from_session_id, to_session_id, score |
| `website.py` | website_* | WebsiteService, WebsiteContact, WebsiteMember, WebsiteSetting |

## Servicios

| Archivo | Qué hace |
|---|---|
| `auth_service.py` | Registro, login, generación de JWT |
| `ollama_service.py` | Interfaz con Ollama (3 roles: chat, reasoning, embed) |
| `rag_service.py` | Pipeline RAG: chunking → ChromaDB → búsqueda semántica |
| `document_loader.py` | Parsing de PDFs (pypdf, pymupdf) |
| `gmail_service.py` | Gmail OAuth, leer/buscar/enviar emails |
| `web_search_service.py` | Búsqueda web con DuckDuckGo |

## Modelos de Ollama utilizados
- `qwen3:8b` — chat general
- `deepseek-r1:8b` — razonamiento complejo
- `nomic-embed-text` — embeddings para RAG
- `llava:7b` — visión/OCR en documentos escaneados

## Endpoints

### Auth — `/auth`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/setup` | Setup inicial (email, password) |
| POST | `/auth/login` | Login → JWT token |
| GET | `/auth/me` | Usuario actual |

### Chat — `/chat`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/chat/sessions` | Crear nueva sesión |
| GET | `/chat/sessions` | Listar sesiones del usuario |
| GET | `/chat/sessions/{id}/messages` | Mensajes de una sesión |
| PATCH | `/chat/sessions/{id}` | Renombrar sesión |
| POST | `/chat/stream` | **Streaming SSE** con loop ReAct |

### Documents — `/documents`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/documents/upload` | Subir PDF/archivo |
| GET | `/documents` | Listar documentos |
| GET | `/documents/{filename}/preview` | Preview texto |
| DELETE | `/documents/{filename}` | Eliminar |

### Ingest — `/ingest`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/ingest/ingest` | Ingestar archivo al vector DB |
| POST | `/ingest/ingest/text` | Ingestar texto raw |

### Gmail — `/gmail`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/gmail/status` | Estado de autenticación |
| GET | `/gmail/auth` | Flujo OAuth |
| GET | `/gmail/inbox` | Bandeja de entrada |
| GET | `/gmail/unread` | Emails no leídos |
| GET | `/gmail/search` | Buscar emails |
| GET | `/gmail/email/{id}` | Detalle de email |
| POST | `/gmail/send` | Enviar email |
| POST | `/gmail/mark-read/{id}` | Marcar como leído |

### Website CMS — `/website`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/website/services` | Listar servicios (público) |
| GET | `/website/services/{slug}` | Servicio por slug (público) |
| GET | `/website/contacts` | Info de contacto (público) |
| GET | `/website/members` | Miembros del equipo (público) |
| GET | `/website/settings` | Settings del sitio (público) |
| * | `/website/admin/*` | CRUD completo (requiere auth) |

### Otros
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` o `/` | Health check |
| GET | `/images/*` | Servir imágenes estáticas desde `data/images/` |

## Almacenamiento
- `data/docs/` — PDFs subidos
- `data/images/` — Imágenes procesadas
- `data/vectordb/` — ChromaDB (embeddings para RAG)
