# Website — Vue (Sitio público)

**Ubicación:** `website/`
**Framework:** Vue 3.5.24 + Vite + TypeScript
**Corre en:** `http://localhost:5174` (dev)
**Propósito:** Landing page / sitio de marketing público que muestra los servicios y contacto

## Stack
- Vue 3 (Composition API) + Vite
- Vue Router 4.5
- Tailwind CSS 3.4
- TypeScript

## Estructura

```
website/src/
├── views/
│   ├── HomeView.vue           # Landing page completa (usa secciones del paquete UI)
│   └── ServiceDetailView.vue  # Detalle de un servicio individual (routing por slug)
├── router/
│   └── index.ts               # Rutas de Vue Router
└── App.vue                    # Componente raíz
```

## Rutas

| Ruta | Vista | Descripción |
|---|---|---|
| `/` | HomeView.vue | Home con todas las secciones |
| `/servicios/:slug` | ServiceDetailView.vue | Detalle de servicio por slug |

- Smooth scroll activado
- Soporte para anchor hash en URL

## Secciones de la Home (componentes de `packages/ui`)

| Componente | Qué muestra |
|---|---|
| TheNavbar | Navegación superior |
| HeroSection | Banner principal |
| ServicesSection | Grid/listado de servicios (consume API del backend) |
| AboutSection | Info de la empresa / equipo |
| ContactSection | Info de contacto o formulario |
| TheFooter | Pie de página |

## Datos dinámicos
El sitio consume el backend (API pública sin auth):
- `GET /website/services` — listado de servicios
- `GET /website/services/{slug}` — detalle de servicio
- `GET /website/contacts` — info de contacto
- `GET /website/members` — miembros del equipo
- `GET /website/settings` — configuración del sitio (textos, logo, etc.)
