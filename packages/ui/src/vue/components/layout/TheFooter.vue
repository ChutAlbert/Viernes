<script setup lang="ts">
import { useSiteSettings } from '../../composables/useWebsiteContent'

const { settings } = useSiteSettings()
const year = new Date().getFullYear()

const links = [
  { label: 'Inicio', href: '#home' },
  { label: 'Servicios', href: '#services' },
  { label: 'Nosotros', href: '#about' },
  { label: 'Contacto', href: '#contact' },
]

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a class="footer-logo" href="#home" @click.prevent="scrollTo('#home')">
          <span class="logo-dot"></span>
          {{ settings.company_name }}
        </a>
        <p class="footer-tagline">{{ settings.company_tagline }}</p>
      </div>
      <nav class="footer-nav">
        <a v-for="link in links" :key="link.href" :href="link.href" class="footer-link"
          @click.prevent="scrollTo(link.href)">{{ link.label }}</a>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p class="copyright">© {{ year }} {{ settings.company_name }}. Todos los derechos reservados.</p>
      <p class="made-with">Hecho con ♥ en México</p>
    </div>
  </footer>
</template>

<style scoped>
.footer { background: var(--bg); border-top: 1px solid var(--border-soft); padding: 2.5rem 0 1.5rem; }
.footer-inner {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 1.5rem;
  padding-bottom: 2rem; border-bottom: 1px solid var(--border-soft); margin-bottom: 1.5rem;
}
.footer-logo {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 1.2rem; font-weight: 800; letter-spacing: -0.03em;
  color: var(--text); margin-bottom: 0.5rem;
}
.logo-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan), var(--amber));
}
.footer-tagline { font-size: 0.85rem; color: var(--text-muted); }
.footer-nav { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.footer-link { font-size: 0.88rem; color: var(--text-muted); transition: color 0.2s; }
.footer-link:hover { color: var(--cyan); }
.footer-bottom {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 0.5rem;
}
.copyright, .made-with { font-size: 0.8rem; color: var(--text-muted); }
@media (max-width: 640px) {
  .footer-inner { flex-direction: column; align-items: flex-start; }
  .footer-bottom { flex-direction: column; align-items: flex-start; }
}
</style>
