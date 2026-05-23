# CLAUDE.md — Proyecto Viernes / Sodigic

Guía de contexto para Claude Code. Léela completa antes de tocar código.

---

## ⚠️ REGLA CRÍTICA — Migraciones de Alembic

**NO ejecutes `alembic upgrade head` ni ningún comando de migración sin permiso explícito del usuario.**

### Por qué existe esta regla

El 19 de mayo de 2026, Claude generó y aplicó automáticamente la migración `3bae22668b71_device_locations.py`. Esa migración fue auto-generada por Alembic (`autogenerate`) y contenía drops accidentales:

- `op.drop_table('piezas')` — eliminó todos los registros de piezas vendidas/encargadas
- `op.drop_table('website_services')` — eliminó los servicios del sitio web
- `op.drop_table('website_contacts')` — eliminó los contactos
- `op.drop_table('website_members')` — eliminó los miembros del equipo
- `op.drop_table('website_settings')` — eliminó la configuración del hero/sitio

Los datos de producción se perdieron de forma irreversible.

### Flujo correcto para migraciones

```bash
# 1. Generar la migración
alembic revision --autogenerate -m "descripción"

# 2. REVISAR manualmente el archivo generado en alembic/versions/
#    Verificar que NO haya drops inesperados antes de aplicar

# 3. Solo aplicar con permiso explícito del usuario
alembic upgrade head
```

**Si necesitas crear una migración, muéstrale el contenido al usuario antes de aplicarla.**

---

## Estructura del proyecto

Monorepo con npm workspaces. Cinco componentes principales:

```
Viernes/
├── backend/          # FastAPI + PostgreSQL + Ollama (Python)
├── dashboard/        # Panel de administración (React + Vite)
├── website/          # Sitio público Sodigic (Vue 3 + Vite)
├── mobile/           # App móvil (React Native / Expo)
└── packages/
    └── ui/           # Librería de componentes compartidos (React + Vue, TypeScript)
```

### Puertos en desarrollo

| Servicio   | Puerto | Comando              |
|------------|--------|----------------------|
| Backend    | 8000   | `uvicorn main:app --reload` (en `backend/`) |
| Dashboard  | 5173   | `npm run dev` (en `dashboard/`) |
| Website    | 4173   | `npm run dev` (en `website/`) |
| Mobile     | —      | `expo start` (en `mobile/`) |

---

## Backend (`backend/`)

**Stack:** FastAPI · SQLAlchemy · PostgreSQL · Alembic · Ollama

### Rutas registradas

| Router | Prefijo | Descripción |
|--------|---------|-------------|
| `auth` | `/auth` | Login, JWT, `/me` |
| `chat` | `/chat` | Chat IA (normal, stream SSE, voz-a-voz) |
| `documents` | `/documents` | Gestión de documentos RAG |
| `ingest` | `/ingest` | Ingesta de docs al vectorstore |
| `gmail` | `/gmail` | Lectura/envío de correos via OAuth |
| `website` | `/website` | CRUD del contenido del sitio público |
| `images` | `/images` | Subida de imágenes |
| `files` | `/files` | Subida de archivos 3D |
| `pieza` | `/piezas` | Registro de piezas 3D vendidas/encargadas |
| `visits` | `/api/visits` | Tracking de visitas al sitio |
| `catalogo` | `/catalogo` | Catálogo 3D público y admin |
| `inventario` | `/inventario` | Inventario de materiales |
| `redes` | `/redes` | Redes sociales |
| `notes` | `/notes` | Notas personales con adjuntos |
| `vault` | `/vault` | Gestor de contraseñas E2E cifrado |
| `users` | `/users` | Gestión de usuarios (admin) |
| `gallery` | `/gallery` | Galería privada E2E cifrada |
| `tasks` | `/tasks` | Tareas con notas de voz |
| `locations` | `/locations` | Ubicación de dispositivos en tiempo real |
| `health` | `/health` | Health check |

### Modelos IA (Ollama, local)

| Rol | Modelo | Configurable en `.env` |
|-----|--------|----------------------|
| Chat general | `qwen3:8b` | `OLLAMA_CHAT_MODEL` |
| Razonamiento | `deepseek-r1:8b` | `OLLAMA_REASONING_MODEL` |
| Embeddings (RAG) | `nomic-embed-text` | `OLLAMA_EMBED_MODEL` |
| Visión / OCR | `llava:7b` | `OLLAMA_VISION_MODEL` |
| STT (Voz) | Whisper `large-v3` | `WHISPER_MODEL_SIZE` |
| TTS (Voz) | Kokoro `.fp16.onnx` | `KOKORO_MODEL_FILE` |

El reasoning puede correr en una segunda PC via `OLLAMA_REASONING_URL`.

### Tablas en base de datos

```
users                     — usuarios del dashboard
chat_sessions             — sesiones de chat IA
chat_messages             — mensajes de chat
memory_items              — memoria del asistente
documents (filesystem)    — docs RAG (no tabla, archivos en data/docs/)
piezas                    — registro de piezas 3D vendidas/encargadas
catalogo_productos        — productos del catálogo público
catalogo_filamentos       — materiales/colores disponibles
catalogo_producto_filamentos — relación producto ↔ filamento
catalogo_producto_imagenes   — galería de imágenes por producto
inventario_items          — items del inventario
inventario_compras        — compras de inventario
website_services          — servicios del sitio web
website_contacts          — datos de contacto del sitio
website_members           — equipo/miembros del sitio
website_settings          — configuración del hero y textos
redes_sociales            — links de redes sociales
notes                     — notas con adjuntos
password_entries          — contraseñas cifradas E2E
vault_config              — config del vault de contraseñas
gallery_items             — galería privada cifrada E2E
gallery_config            — config de la galería
tasks                     — tareas con audio
session_links             — links de sesión
page_visits               — visitas al sitio web
device_locations          — ubicaciones GPS de dispositivos
```

### Archivos en disco (`data/`)

```
data/
├── docs/           # Documentos para RAG
├── images/         # Imágenes subidas (servidas en /images)
├── files/          # Archivos 3D (.stl, etc.)
├── notes_files/    # Adjuntos de notas
├── tasks_audio/    # Audios de tareas
├── gallery/        # Galería privada (blobs cifrados)
├── vectordb/       # ChromaDB (embeddings RAG)
└── voice_models/   # Modelos Whisper y Kokoro locales
```

### CORS

Configurado en `backend/.env` → `CORS_ORIGINS`:

```
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:4173
```

---

## Dashboard (`dashboard/`)

**Stack:** React 18 · React Router 7 · Redux Toolkit · Axios · Tailwind CSS · Vite

### Páginas y rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | `Login` | Autenticación JWT |
| `/app` | `Dashboard` | Overview con stats |
| `/app/chat` | `Chat` | Chat IA con streaming SSE y voz-a-voz |
| `/app/gmail` | `Gmail` | Bandeja de entrada Gmail |
| `/app/docs` | `Documents` | Documentos RAG |
| `/app/website` | `Website` | CMS del sitio público (servicios, contacto, equipo, settings) |
| `/app/website/services/:slug` | `ServiceDetail` | Detalle/edición de servicio |
| `/app/piezas` | `Piezas` | Lista de piezas 3D vendidas/encargadas |
| `/app/piezas/:id` | `PiezaDetail` | Detalle de pieza con fotos, pagos, archivos |
| `/app/catalogo` | `Catalogo` | Admin del catálogo público de productos |
| `/app/catalogo/:id` | `CatalogoProductoDetail` | Detalle/edición de producto del catálogo |
| `/app/inventario` | `Inventario` | Inventario de materiales |
| `/app/redes` | `RedesSociales` | Gestión de redes sociales |
| `/app/notes` | `Notes` | Notas personales |
| `/app/passwords` | `Passwords` | Vault de contraseñas E2E |
| `/app/gallery` | `Gallery` | Galería privada E2E |
| `/app/tasks` | `Tasks` | Tareas con notas de voz |
| `/app/qr` | `QRGenerator` | Generador de QR |
| `/app/ubicaciones` | `Ubicaciones` | Mapa de ubicación de dispositivos (Mapbox) |
| `/app/users` | `Users` | Gestión de usuarios (solo admin) |

### Auth

- Token JWT guardado en `localStorage` como `viernes_token`
- Roles: `user`, `admin`, `super_admin`
- Vault y gallery usan cifrado E2E adicional en el cliente

---

## Website (`website/`)

**Stack:** Vue 3 · TypeScript · Vue Router 4 · Three.js · Vite (puerto 4173)

### Vistas

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | `HomeView` | Landing page con hero, servicios, stats |
| `/catalogo` | `CatalogoView` | Catálogo 3D con calculadora de precio |
| `/catalogo/:slug` | `CatalogoProductoView` | Detalle de producto con visor 3D (Three.js) |
| `/servicios/:slug` | `ServiceDetailView` | Detalle de servicio |
| `/nosotros` | `NosotrosView` | Equipo y sobre nosotros |
| `/contacto` | `ContactoView` | Formulario/datos de contacto |

### Composables que consumen la API

| Composable | Endpoint | Tabla |
|-----------|----------|-------|
| `useProductos()` | `GET /catalogo/public/productos` | `catalogo_productos` |
| `useProducto(slug)` | `GET /catalogo/public/productos/:slug` | `catalogo_productos` |
| `useServices()` | `GET /website/services` | `website_services` |
| `useContacts()` | `GET /website/contacts` | `website_contacts` |
| `useMembers()` | `GET /website/members` | `website_members` |
| `useSiteSettings()` | `GET /website/settings` | `website_settings` |
| `useRedes()` | `GET /redes/public` | `redes_sociales` |
| `usePiezasSincronizadas()` | `GET /piezas/public/sincronizadas` | `piezas` |

---

## Mobile (`mobile/`)

**Stack:** React Native · Expo 52 · Expo Router · Redux Toolkit

App de acceso personal al mismo backend. **No es parte del workspace npm** (tiene su propio `node_modules`).

### Pantallas

Dashboard, Chat, Gmail, Docs, Piezas, Catálogo, Inventario, Notas, Contraseñas, Tareas, QR, Redes, Website, Usuarios, Ubicaciones, Login.

---

## UI Package (`packages/ui/`)

**Stack:** TypeScript. Exporta componentes para React y Vue.

```
packages/ui/src/
├── react/
│   └── components/    # Button, Input, Modal, Card, Spinner, NavItem, etc.
└── vue/
    ├── components/    # TheNavbar, TheFooter, secciones del sitio (Hero, Services, etc.)
    └── composables/   # useWebsiteContent.ts, useScrollAnimation.ts
```

Consumido como `@viernes/ui/react` en el dashboard y `@viernes/ui/vue` en el website.
**Requiere build** (`npm run build` en `packages/ui/`) al cambiar componentes.

---

## Comandos frecuentes

```bash
# Instalar todo (desde raíz)
npm install

# Correr dashboard
cd dashboard && npm run dev

# Correr website
cd website && npm run dev

# Correr backend
cd backend && uvicorn main:app --reload

# Correr mobile
cd mobile && expo start

# Build del paquete UI (requerido tras cambios en packages/ui/)
cd packages/ui && npm run build

# Ver estado de migraciones (SOLO VER, no aplicar)
cd backend && .venv/Scripts/python.exe -m alembic current
cd backend && .venv/Scripts/python.exe -m alembic history

# Aplicar migraciones (SOLO con permiso explícito)
cd backend && .venv/Scripts/python.exe -m alembic upgrade head
```
