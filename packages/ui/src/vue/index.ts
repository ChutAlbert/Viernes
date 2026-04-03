// Layout
export { default as TheNavbar } from './components/layout/TheNavbar.vue'
export { default as TheFooter } from './components/layout/TheFooter.vue'

// Sections
export { default as HeroSection } from './components/sections/HeroSection.vue'
export { default as AboutSection } from './components/sections/AboutSection.vue'
export { default as ServicesSection } from './components/sections/ServicesSection.vue'
export { default as ContactSection } from './components/sections/ContactSection.vue'

// Composables
export { useServices, useContacts, useMembers, useSiteSettings } from './composables/useWebsiteContent'
export { useScrollAnimation, useActiveSection } from './composables/useScrollAnimation'

// Types
export type { Service, Contact, Member, SiteSettings } from './types'
