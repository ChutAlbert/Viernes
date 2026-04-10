# UI — Paquete de componentes compartidos

**Ubicación:** `packages/ui/`
**Propósito:** Librería de componentes reutilizables exportada para React (dashboard) y Vue (website)

## Stack
- TypeScript
- React 18 (componentes React)
- Vue 3 (componentes Vue)
- Tailwind CSS

## Estructura

```
packages/ui/src/
├── react/
│   ├── components/
│   │   ├── dashboard/     StatCard, StatCardDark
│   │   ├── documents/     DocRow, PreviewPane
│   │   ├── form/          Button, Input, Select, Textarea, FileInput, Label
│   │   ├── layout/        AppShell, Container
│   │   ├── nav/           NavItem, SidebarShell, TopbarShell
│   │   ├── overlay/       Modal, Drawer
│   │   └── ui/            Card, Spinner, Surface
│   └── utils/
└── vue/
    ├── components/
    │   ├── layout/        TheNavbar, TheFooter
    │   └── sections/      HeroSection, AboutSection, ServicesSection, ContactSection
    ├── composables/
    ├── types/
    └── utils/
```

## Componentes React

| Categoría | Componentes |
|---|---|
| **Dashboard** | StatCard, StatCardDark — tarjetas de métricas |
| **Documents** | DocRow — fila de documento; PreviewPane — panel de vista previa |
| **Form** | Button, Input, Select, Textarea, FileInput, Label |
| **Layout** | AppShell — shell principal; Container — wrapper con padding |
| **Nav** | NavItem — ítem de nav; SidebarShell — wrapper sidebar; TopbarShell — wrapper topbar |
| **Overlay** | Modal — modal; Drawer — panel lateral deslizable |
| **UI** | Card — tarjeta; Spinner — loading; Surface — superficie/fondo |

## Componentes Vue

| Categoría | Componentes |
|---|---|
| **Layout** | TheNavbar — nav superior; TheFooter — pie de página |
| **Sections** | HeroSection, AboutSection, ServicesSection, ContactSection |

## Cómo importar

**React (dashboard):**
```js
import { Button, Input, Modal } from '@viernes/ui/react'
```

**Vue (website):**
```js
import { TheNavbar, HeroSection } from '@viernes/ui/vue'
```
