// Layout
export { default as TheNavbar } from './components/layout/TheNavbar.vue'
export { default as TheFooter } from './components/layout/TheFooter.vue'

// Sections
export { default as HeroSection } from './components/sections/HeroSection.vue'
export { default as AboutSection } from './components/sections/AboutSection.vue'
export { default as ServicesSection } from './components/sections/ServicesSection.vue'
export { default as ContactSection } from './components/sections/ContactSection.vue'
export { default as WorksSection } from './components/sections/WorksSection.vue'

// Composables
export { useServices, useContacts, useMembers, useSiteSettings, useServiceBySlug, usePiezasSincronizadas } from './composables/useWebsiteContent'
export { useScrollAnimation, useActiveSection } from './composables/useScrollAnimation'

// Utils
export { textoDe, hrefDe, colorDe, COLOR_POR_TIPO } from './utils/contacto'

// Types
export type { Service, Contact, Member, SiteSettings } from './types'
