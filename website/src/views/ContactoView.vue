<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ContactSection } from '@viernes/ui/vue'
import { useScrollAnimation } from '@viernes/ui/vue'
import { useRedes } from '@/composables/useCatalogo'

useScrollAnimation()

const route = useRoute()
const { redes } = useRedes()

const solicitud = computed(() => {
  const p = route.query
  if (!p.pieza) return null
  return {
    pieza:     String(p.pieza),
    tamano:    p.tamano    ? String(p.tamano)    : null,
    filamento: p.filamento ? String(p.filamento) : null,
    precio:    p.precio    ? String(p.precio)    : null,
  }
})

const ICONOS_SVG: Record<string, string> = {
  instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  facebook:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  whatsapp:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  tiktok:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
  x:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  youtube:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20.06 12 20.06 12 20.06s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
  linkedin:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  telegram:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  website:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
}

function iconoSvg(icono: string): string {
  return ICONOS_SVG[icono] ?? ICONOS_SVG.website
}
</script>

<template>
  <main>
    <!-- Tarjeta de pieza solicitada — prominente cuando viene del catálogo -->
    <div v-if="solicitud" class="solicitud-section">
      <div class="solicitud-container">
        <div class="solicitud-card">
          <div class="sol-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="sol-body">
            <p class="sol-label">Pieza solicitada</p>
            <p class="sol-nombre">{{ solicitud.pieza }}</p>
            <div class="sol-chips">
              <span v-if="solicitud.filamento" class="sol-chip">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                {{ solicitud.filamento }}
              </span>
              <span v-if="solicitud.tamano" class="sol-chip">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                {{ solicitud.tamano }}
              </span>
              <span v-if="solicitud.precio" class="sol-chip precio">{{ solicitud.precio }}</span>
            </div>
          </div>
          <div class="sol-nota">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            El precio es estimado. Te confirmamos el costo exacto al recibir tu mensaje.
          </div>
        </div>
      </div>
    </div>

    <!-- Redes sociales -->
    <div v-if="redes.length > 0" class="redes-section">
      <div class="redes-container">
        <p class="redes-titulo">Encuéntranos en</p>
        <div class="redes-lista">
          <a
            v-for="red in redes"
            :key="red.id"
            :href="red.url"
            target="_blank"
            rel="noopener noreferrer"
            class="red-link"
            :title="red.nombre"
          >
            <span class="red-icono" v-html="iconoSvg(red.icono)" />
            <span class="red-nombre">{{ red.nombre }}</span>
          </a>
        </div>
      </div>
    </div>

    <ContactSection />
  </main>
</template>

<style scoped>
.solicitud-section {
  padding: 7rem 0 0;
  background: var(--bg);
}

.solicitud-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.solicitud-card {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.2);
  flex-wrap: wrap;
}

.sol-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
  flex-shrink: 0;
}

.sol-body { flex: 1; min-width: 160px; }

.sol-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 0.2rem;
}

.sol-nombre {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.01em;
  margin-bottom: 0.6rem;
}

.sol-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sol-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-soft);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-soft);
  padding: 0.25rem 0.65rem;
  border-radius: 99px;
}

.sol-chip.precio {
  color: var(--cyan);
  background: rgba(34, 211, 238, 0.08);
  border-color: rgba(34, 211, 238, 0.22);
  font-size: 0.88rem;
  font-weight: 700;
}

.sol-nota {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.5;
  align-self: center;
  max-width: 220px;
}

.redes-section {
  background: var(--bg);
  padding: 1.5rem 0 0;
}
.redes-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.redes-titulo {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}
.redes-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.red-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-soft);
  color: var(--text-soft);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.red-link:hover {
  background: rgba(34,211,238,0.08);
  border-color: rgba(34,211,238,0.25);
  color: var(--cyan);
}
.red-icono { display: flex; align-items: center; }
.red-icono svg { display: block; }

@media (max-width: 640px) {
  .solicitud-section { padding: 6rem 0 0; }
  .sol-nota { max-width: 100%; }
}
</style>
