# Dashboard — React (Viernes Admin)

**Ubicación:** `dashboard/`
**Framework:** React 18.3.1 + Vite
**Corre en:** `http://localhost:5173` (dev)
**Propósito:** Interfaz de administración interna — chat con LLM, documentos, Gmail, CMS del sitio web

## Stack
- React 18 + Vite 7
- Redux Toolkit (estado global)
- React Router 7
- Axios (HTTP client)
- Tailwind CSS 3.4

## Estructura

```
dashboard/src/
├── app/
│   ├── layouts/
│   │   ├── AuthLayout.jsx       # Wrapper para rutas sin auth
│   │   └── DashboardLayout.jsx  # Wrapper con sidebar + topbar
│   ├── pages/
│   │   ├── Login.jsx            # Página de login
│   │   ├── Dashboard.jsx        # Vista principal (stats/overview)
│   │   ├── Chat.jsx             # Chat con Ollama (streaming, sesiones)
│   │   ├── Documents.jsx        # Gestión de documentos (upload, preview)
│   │   ├── Gmail.jsx            # Integración Gmail (leer, buscar, enviar)
│   │   ├── Website.jsx          # CMS del website (servicios, contactos, etc.)
│   │   └── ServiceDetail.jsx    # Detalle de un servicio
│   └── routes.jsx               # Configuración de React Router
├── components/
│   ├── AppSidebar.jsx           # Menú de navegación lateral
│   ├── AppTopbar.jsx            # Header con info de usuario
│   └── RequireAuth.jsx          # Guard de autenticación
├── lib/
│   └── apis/
│       ├── client.js            # Instancia de Axios con headers de auth
│       ├── auth.js              # Llamadas: login, setup, /me
│       └── viernes.js           # Todas las demás llamadas al backend
└── store/
    ├── index.js                 # Redux store
    ├── authSlice.js             # Estado de auth (token, user, loading, error)
    └── theme.jsx                # Toggle dark/light
```

## Rutas

| Ruta | Componente | Requiere auth |
|---|---|---|
| `/login` | Login.jsx | No |
| `/app` | DashboardLayout | Sí |
| `/app/chat` | Chat.jsx | Sí |
| `/app/documents` | Documents.jsx | Sí |
| `/app/gmail` | Gmail.jsx | Sí |
| `/app/website` | Website.jsx | Sí |
| `/app/services/:serviceId` | ServiceDetail.jsx | Sí |

## Features principales
- Auth JWT con persistencia en localStorage
- Redux para estado global de auth
- Chat en tiempo real con streaming SSE
- Preview de documentos con extracción de texto
- Bandeja de entrada Gmail integrada
- CMS: CRUD de servicios, contactos, miembros y settings del website
- Layout responsive: sidebar + topbar
- Toggle de tema dark/light

## Componentes UI compartidos
Importa de `packages/ui` (ver `ui.md`):
- Form: Button, Input, Select, Textarea, FileInput, Label
- Layout: AppShell, Container
- Nav: NavItem, SidebarShell, TopbarShell
- Overlay: Modal, Drawer
- UI: Card, Spinner, Surface
- Dashboard: StatCard, StatCardDark
- Documents: DocRow, PreviewPane
