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

@media (max-width: 640px) {
  .solicitud-section { padding: 6rem 0 0; }
  .sol-nota { max-width: 100%; }
}
</style>
