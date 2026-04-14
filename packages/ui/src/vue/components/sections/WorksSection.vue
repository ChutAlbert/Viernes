<script setup lang="ts">
import { ref } from 'vue'
import { usePiezasSincronizadas } from '../../composables/useWebsiteContent'

const API: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000'

const { piezas, loading } = usePiezasSincronizadas()

// Índice de foto activa por pieza
const photoIndex = ref<Record<number, number>>({})

function getPhotoIndex(id: number) {
  return photoIndex.value[id] ?? 0
}

function photoUrl(url: string): string {
  return url.startsWith('http') ? url : `${API}${url}`
}

function prevPhoto(id: number, total: number) {
  const cur = getPhotoIndex(id)
  photoIndex.value[id] = (cur - 1 + total) % total
}

function nextPhoto(id: number, total: number) {
  const cur = getPhotoIndex(id)
  photoIndex.value[id] = (cur + 1) % total
}

function formatPrice(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

function total(precios?: number[] | null): number {
  if (!precios || precios.length === 0) return 0
  return precios.reduce((a, b) => a + b, 0)
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

      <!-- Empty -->
      <div v-else-if="piezas.length === 0" class="works-empty animate-on-scroll">
        <p>Próximamente trabajos en esta sección.</p>
      </div>

      <!-- Grid -->
      <div v-else class="works-grid">
        <div
          v-for="(pieza, i) in piezas"
          :key="pieza.id"
          class="work-card animate-on-scroll"
          :class="`delay-${(i % 4) + 1}`"
        >
          <!-- Fotos con navegación -->
          <div class="work-photo">
            <template v-if="pieza.fotos && pieza.fotos.length > 0">
              <img
                :src="photoUrl(pieza.fotos[getPhotoIndex(pieza.id)])"
                :alt="pieza.nombre"
                loading="lazy"
              />
              <!-- Flechas si hay más de 1 foto -->
              <template v-if="pieza.fotos.length > 1">
                <button class="photo-nav photo-nav--prev" @click.stop="prevPhoto(pieza.id, pieza.fotos!.length)">‹</button>
                <button class="photo-nav photo-nav--next" @click.stop="nextPhoto(pieza.id, pieza.fotos!.length)">›</button>
                <div class="photo-dots">
                  <span
                    v-for="(_, idx) in pieza.fotos"
                    :key="idx"
                    class="photo-dot"
                    :class="{ active: idx === getPhotoIndex(pieza.id) }"
                  />
                </div>
              </template>
            </template>
            <div v-else class="work-photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
              </svg>
            </div>
          </div>

          <!-- Info: solo nombre, precios y total -->
          <div class="work-info">
            <h3 class="work-name">{{ pieza.nombre }}</h3>

            <template v-if="pieza.precios && pieza.precios.length > 0">
              <div class="work-prices">
                <div
                  v-for="(precio, idx) in pieza.precios"
                  :key="idx"
                  class="work-price-row"
                >
                  <span class="price-label">Pieza {{ pieza.precios.length > 1 ? idx + 1 : '' }}</span>
                  <span class="price-value">{{ formatPrice(precio) }}</span>
                </div>
              </div>
              <div class="work-total">
                <span>Total</span>
                <span>{{ formatPrice(total(pieza.precios)) }}</span>
              </div>
            </template>
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
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
.work-card:hover .work-photo img { transform: scale(1.04); }

.work-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

/* Navegación de fotos */
.photo-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.45);
  border: none;
  color: #fff;
  font-size: 1.4rem;
  line-height: 1;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.work-photo:hover .photo-nav { opacity: 1; }
.photo-nav--prev { left: 0.5rem; }
.photo-nav--next { right: 0.5rem; }

.photo-dots {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}
.photo-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  transition: background 0.2s;
}
.photo-dot.active { background: #fff; }

/* Info */
.work-info {
  padding: 1rem 1.25rem 1.25rem;
}
.work-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.75rem;
}

/* Precios */
.work-prices {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
}
.work-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}
.price-label { color: var(--text-soft); }
.price-value { color: var(--text); font-weight: 600; }

.work-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-soft);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--cyan);
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

.works-empty {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}
</style>
