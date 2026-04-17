<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ContactSection } from '@viernes/ui/vue'
import { useScrollAnimation } from '@viernes/ui/vue'

useScrollAnimation()

const route = useRoute()

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
</script>

<template>
  <main>
    <!-- Banner de contexto cuando se llega desde el catálogo -->
    <div v-if="solicitud" class="solicitud-banner">
      <div class="banner-inner">
        <div class="banner-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="banner-info">
          <span class="banner-label">Pieza solicitada</span>
          <span class="banner-pieza">{{ solicitud.pieza }}</span>
        </div>
        <div v-if="solicitud.filamento || solicitud.tamano || solicitud.precio" class="banner-detalles">
          <span v-if="solicitud.filamento" class="banner-chip">{{ solicitud.filamento }}</span>
          <span v-if="solicitud.tamano" class="banner-chip">{{ solicitud.tamano }}</span>
          <span v-if="solicitud.precio" class="banner-chip precio">{{ solicitud.precio }}</span>
        </div>
      </div>
    </div>

    <ContactSection />
  </main>
</template>

<style scoped>
.solicitud-banner {
  background: rgba(34, 211, 238, 0.06);
  border-bottom: 1px solid rgba(34, 211, 238, 0.18);
  padding: 1rem 0;
}

.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.banner-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(34, 211, 238, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
  flex-shrink: 0;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.banner-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--cyan);
}

.banner-pieza {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.banner-detalles {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.banner-chip {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-soft);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-soft);
  padding: 0.25rem 0.65rem;
  border-radius: 99px;
}

.banner-chip.precio {
  color: var(--cyan);
  background: rgba(34, 211, 238, 0.08);
  border-color: rgba(34, 211, 238, 0.2);
}

@media (max-width: 640px) {
  .banner-inner { gap: 0.75rem; }
  .banner-detalles { margin-left: 0; }
}
</style>
