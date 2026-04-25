<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from '../../composables/useWebsiteContent'

const { services } = useServices()
const router = useRouter()

const scrolled = ref(false)
const mobileOpen = ref(false)
const servicesOpen = ref(false)

// ── Theme ─────────────────────────────────────────────────────────────────────
const isDark = ref(true)

function initTheme() {
  const saved = localStorage.getItem('viernes_theme')
  isDark.value = saved !== 'light'
  document.documentElement.classList.toggle('light', !isDark.value)
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('light', !isDark.value)
  localStorage.setItem('viernes_theme', isDark.value ? 'dark' : 'light')
}

const navLinks = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
]

function onScroll() {
  scrolled.value = window.scrollY > 20
}

function navigateTo(to: string) {
  mobileOpen.value = false
  servicesOpen.value = false
  router.push(to)
}

function goHome() {
  mobileOpen.value = false
  router.push('/')
}

function toggleServices(e: Event) {
  e.stopPropagation()
  servicesOpen.value = !servicesOpen.value
}

function closeServices() {
  servicesOpen.value = false
}

onMounted(() => {
  initTheme()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', closeServices)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', closeServices)
})
</script>

<template>
  <nav class="navbar" :class="{ scrolled }">
    <div class="container nav-inner">
      <a class="nav-logo" href="/" @click.prevent="goHome">
        <img src="/sdc.png" alt="SODIGIC" class="logo-img" />
        SODIGIC
      </a>

      <ul class="nav-links">
        <li style="position: relative;">
          <button class="nav-btn" @click.stop="toggleServices">
            Servicios
            <svg class="chevron" :class="{ open: servicesOpen }" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <Transition name="dropdown">
            <div v-if="servicesOpen" class="services-dropdown" @click.stop>
              <div v-if="services.length === 0" class="dropdown-empty">Cargando servicios...</div>
              <a
                v-for="svc in services"
                :key="svc.id"
                class="dropdown-item"
                :href="svc.slug ? `/servicios/${svc.slug}` : '#services'"
                @click="!svc.slug && ($event.preventDefault(), navigateTo('/#services'))"
              >
                <span class="dropdown-icon">◈</span>
                <div>
                  <div class="dropdown-title">{{ svc.title }}</div>
                  <div class="dropdown-desc">{{ svc.description.slice(0, 60) }}…</div>
                </div>
              </a>
            </div>
          </Transition>
        </li>

        <li v-for="link in navLinks" :key="link.to">
          <a class="nav-link" :href="link.to" @click.prevent="navigateTo(link.to)">{{ link.label }}</a>
        </li>
      </ul>

      <!-- Theme toggle -->
      <button class="theme-toggle hidden-mobile" @click="toggleTheme" :title="isDark ? 'Modo claro' : 'Modo oscuro'">
        <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <a class="btn btn-primary nav-cta hidden-mobile" href="/contacto" @click.prevent="navigateTo('/contacto')">
        Contáctanos
      </a>

      <button class="hamburger" :class="{ open: mobileOpen }" @click="mobileOpen = !mobileOpen">
        <span></span><span></span><span></span>
      </button>
    </div>

    <Transition name="mobile-menu">
      <div v-if="mobileOpen" class="mobile-menu">
        <button class="mobile-link" @click="navigateTo('/#services')">Servicios</button>
        <a v-for="link in navLinks" :key="link.to" class="mobile-link" :href="link.to"
          @click.prevent="navigateTo(link.to)">{{ link.label }}</a>
        <div class="mobile-divider" />
        <button class="mobile-theme-btn" @click="toggleTheme">
          <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
        </button>
        <a class="btn btn-primary mobile-cta" href="/contacto" @click.prevent="navigateTo('/contacto')">Contáctanos</a>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 1.1rem 0;
  transition: background 0.3s, box-shadow 0.3s, padding 0.3s;
}
.navbar.scrolled {
  background: rgba(from var(--bg) r g b / 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 0 var(--border-soft);
  padding: 0.75rem 0;
}

/* Fallback para navegadores sin relative color syntax */
:root:not(.light) .navbar.scrolled {
  background: rgba(5, 13, 31, 0.88);
}
:root.light .navbar.scrolled {
  background: rgba(240, 244, 248, 0.92);
  box-shadow: 0 1px 0 var(--border-soft);
}
.nav-inner { display: flex; align-items: center; gap: 2rem; }
.nav-logo {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 1.25rem; font-weight: 800; letter-spacing: -0.03em;
  color: var(--text); flex-shrink: 0;
}
.logo-img {
  width: 28px; height: 28px; object-fit: contain;
  border-radius: 6px;
}
.nav-links {
  display: flex; align-items: center; gap: 0.25rem;
  list-style: none; margin-left: auto;
}
.nav-link, .nav-btn {
  padding: 0.5rem 0.875rem; border-radius: 8px;
  font-size: 0.9rem; font-weight: 500; color: var(--text-soft);
  transition: var(--transition); cursor: pointer;
  background: none; border: none; font-family: inherit;
  display: flex; align-items: center; gap: 0.35rem;
}
.nav-link:hover, .nav-btn:hover { color: var(--text); background: var(--border-soft); }
.chevron { transition: transform 0.25s ease; }
.chevron.open { transform: rotate(180deg); }
.services-dropdown {
  position: absolute; top: calc(100% + 0.75rem); left: 50%;
  transform: translateX(-50%); width: 320px;
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 0.5rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}
:root.light .services-dropdown {
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  background: var(--bg-card);
}
.dropdown-item {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.875rem; border-radius: var(--radius); transition: background 0.2s; cursor: pointer;
}
.dropdown-item:hover { background: rgba(34,211,238,0.07); }
.dropdown-icon { color: var(--cyan); font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
.dropdown-title { font-size: 0.9rem; font-weight: 600; color: var(--text); }
.dropdown-desc { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
.dropdown-empty { padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
.nav-cta { margin-left: 0.5rem; }

.theme-toggle {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border-soft);
  color: var(--text-soft);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  margin-left: 0.5rem;
}
.theme-toggle:hover {
  color: var(--text);
  background: rgba(255,255,255,0.1);
}
:root.light .theme-toggle {
  background: var(--bg-elevated);
  border-color: var(--border);
}
:root.light .theme-toggle:hover {
  background: var(--border-soft);
  color: var(--text);
}
.hidden-mobile { display: inline-flex; }
.hamburger {
  display: none; flex-direction: column; gap: 5px;
  cursor: pointer; background: none; border: none; padding: 0.5rem; margin-left: auto;
}
.hamburger span {
  display: block; width: 22px; height: 2px;
  background: var(--text); border-radius: 2px; transition: var(--transition);
}
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.mobile-menu {
  display: flex; flex-direction: column;
  padding: 1rem 1.5rem 1.5rem;
  background: var(--bg-elevated); border-top: 1px solid var(--border-soft); gap: 0.25rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.mobile-link {
  display: block; padding: 0.875rem 1rem; border-radius: var(--radius);
  font-size: 1rem; font-weight: 500; color: var(--text-soft);
  background: none; border: none; font-family: inherit;
  cursor: pointer; text-align: left; transition: var(--transition);
}
.mobile-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }
:root.light .mobile-link:hover { background: var(--bg-elevated); }
.mobile-cta { margin-top: 0.75rem; justify-content: center; }
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
.mobile-menu-enter-active, .mobile-menu-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.mobile-menu-enter-from, .mobile-menu-leave-to { opacity: 0; transform: translateY(-8px); }
.mobile-divider {
  height: 1px; background: var(--border-soft); margin: 0.25rem 0;
}
.mobile-theme-btn {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1rem; border-radius: var(--radius);
  font-size: 1rem; font-weight: 500; color: var(--text-soft);
  background: none; border: none; font-family: inherit;
  cursor: pointer; text-align: left; transition: var(--transition); width: 100%;
}
.mobile-theme-btn:hover { color: var(--text); background: rgba(255,255,255,0.05); }
:root.light .mobile-theme-btn:hover { background: var(--bg-elevated); }

@media (max-width: 768px) {
  .nav-links, .hidden-mobile { display: none; }
  .hamburger { display: flex; }
}
</style>
