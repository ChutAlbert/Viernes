<script setup lang="ts">
import { computed } from 'vue'
import { usePiezasSincronizadas } from '../../composables/useWebsiteContent'

const API: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000'

const { piezas, loading } = usePiezasSincronizadas()

function coverPhoto(fotos?: string[] | null): string | null {
  if (!fotos || fotos.length === 0) return null
  const url = fotos[0]
  // Si ya es URL absoluta, úsala directo; si no, prefijar con el API base
  return url.startsWith('http') ? url : `${API}${url}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })
}

const tipoBadge: Record<string, { label: string; color: string }> = {
  encargo:       { label: 'Encargo',       color: 'var(--amber)' },
  venta_general: { label: 'Venta general', color: 'var(--cyan)' },
}

function getBadge(tipo: string) {
  return tipoBadge[tipo] ?? { label: tipo, color: 'var(--text-muted)' }
}
</script>

<template>
  <section id="trabajos" class="works-section">
    <div class="container">
      <div class="section-header animate-on-scroll">
        <div class="section-tag">Lo que hemos hecho</div>
        <h2 class="section-title">Trabajos <span class="highlight">Realizados</span></h2>
        <div class="section-divider"></div>
        <p class="section-subtitle">
          Cada pieza es un proyecto único. Aquí algunos de los trabajos que ya están en manos de sus dueños.
        </p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="works-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="piezas.length === 0" class="works-empty animate-on-scroll">
        <p>Próximamente trabajos en esta sección.</p>
      </div>

      <!-- Grid de piezas -->
      <div v-else class="works-grid">
        <div
          v-for="(pieza, i) in piezas"
          :key="pieza.id"
          class="work-card animate-on-scroll"
          :class="`delay-${(i % 4) + 1}`"
        >
          <!-- Foto -->
          <div class="work-photo">
            <img
              v-if="coverPhoto(pieza.fotos)"
              :src="coverPhoto(pieza.fotos)!"
              :alt="pieza.nombre"
              loading="lazy"
            />
            <div v-else class="work-photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
              </svg>
            </div>
            <!-- Badge tipo -->
            <span
              class="work-badge"
              :style="{ '--badge-color': getBadge(pieza.tipo).color }"
            >{{ getBadge(pieza.tipo).label }}</span>
          </div>

          <!-- Info -->
          <div class="work-info">
            <h3 class="work-name">{{ pieza.nombre }}</h3>
            <div class="work-meta">
              <span v-if="pieza.filamento" class="work-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
                {{ pieza.filamento }}
              </span>
              <span v-if="pieza.fecha_entrega" class="work-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ formatDate(pieza.fecha_entrega) }}
              </span>
            </div>
            <p v-if="pieza.notas" class="work-notes">{{ pieza.notas }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.works-section {
  background: var(--bg);
  padding: 5rem 0;
}

.section-header { margin-bottom: 3rem; }
.section-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 0.75rem;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Card */
.work-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}
.work-card:hover {
  border-color: var(--border);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

/* Foto */
.work-photo {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--bg);
}
.work-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.work-card:hover .work-photo img {
  transform: scale(1.05);
}
.work-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-card), var(--bg));
}

/* Badge */
.work-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.65rem;
  border-radius: 99px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: var(--badge-color, var(--cyan));
  border: 1px solid var(--badge-color, var(--cyan));
}

/* Info */
.work-info {
  padding: 1rem 1.25rem 1.25rem;
}
.work-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}
.work-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}
.work-meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.work-notes {
  font-size: 0.85rem;
  color: var(--text-soft);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Skeleton */
.skeleton-card {
  height: 280px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* Empty */
.works-empty {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}
</style>
