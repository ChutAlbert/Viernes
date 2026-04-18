<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProductos, imagenUrl } from '@/composables/useCatalogo'

const router = useRouter()
const { productos, loading, error } = useProductos()

function goProducto(p: { id: number; slug: string | null }) {
  router.push(`/catalogo/${p.slug ?? p.id}`)
}

function formatDesde(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}
</script>

<template>
  <div class="catalogo-page">
    <!-- Hero -->
    <section class="catalogo-hero">
      <div class="container">
        <div class="hero-badge">Catálogo 3D</div>
        <h1 class="hero-title">Piezas <span class="highlight">personalizables</span></h1>
        <p class="hero-subtitle">
          Elige tu diseño, material, color y tamaño. Calculamos el precio al instante.
        </p>
      </div>
    </section>

    <!-- Banner piezas personalizadas -->
    <section class="personalizable-section">
      <div class="container">
        <div class="personalizable-banner">
          <div class="pb-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div class="pb-body">
            <p class="pb-title">¿Tienes una figura en mente?</p>
            <p class="pb-text">Podemos imprimir casi cualquier diseño a partir de una imagen, foto o descripción. Contáctanos y lo hacemos realidad.</p>
          </div>
          <a href="/contacto" class="pb-cta">Solicitar figura personalizada →</a>
        </div>
      </div>
    </section>

    <!-- Grid -->
    <section class="catalogo-grid-section">
      <div class="container">

        <!-- Loading -->
        <div v-if="loading" class="grid-loading">
          <div v-for="n in 6" :key="n" class="skeleton-card" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="empty-state">
          <p>No se pudo cargar el catálogo. Intenta más tarde.</p>
        </div>

        <!-- Vacío -->
        <div v-else-if="productos.length === 0" class="empty-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          <p>El catálogo estará disponible pronto.</p>
        </div>

        <!-- Cards -->
        <div v-else class="productos-grid">
          <button
            v-for="producto in productos"
            :key="producto.id"
            class="producto-card"
            @click="goProducto(producto)"
          >
            <!-- Preview imagen -->
            <div class="card-img-wrap">
              <img
                v-if="producto.foto_preview_url"
                :src="imagenUrl(producto.foto_preview_url) ?? ''"
                :alt="producto.nombre"
                loading="lazy"
                class="card-img"
              />
              <div v-else class="card-img-placeholder">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="card-body">
              <h3 class="card-title">{{ producto.nombre }}</h3>
              <div class="card-meta">
                <span class="meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                  {{ (producto.tamano_minimo_mm / 10).toFixed(0) }}–{{ (producto.tamano_maximo_mm / 10).toFixed(0) }} cm
                </span>
              </div>
              <div class="card-footer">
                <span v-if="producto.precio_desde" class="card-precio">
                  Desde {{ formatDesde(producto.precio_desde) }}
                </span>
                <span class="card-cta">Personalizar →</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Hero ──────────────────────────────────────────────────────────────────── */
.catalogo-page { min-height: 100vh; }

.catalogo-hero {
  padding: 8rem 0 4rem;
  background: var(--bg);
  border-bottom: 1px solid var(--border-soft);
}

.hero-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
  background: rgba(34,211,238,0.08);
  border: 1px solid rgba(34,211,238,0.18);
  padding: 0.35rem 0.9rem;
  border-radius: 99px;
  margin-bottom: 1.25rem;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-soft);
  max-width: 500px;
  line-height: 1.7;
}

/* ── Personalizable Banner ─────────────────────────────────────────────────── */
.personalizable-section {
  background: var(--bg);
  padding: 2.5rem 0;
}
.personalizable-banner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  background: rgba(139, 92, 246, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  flex-wrap: wrap;
}
.pb-icon {
  width: 48px; height: 48px; flex-shrink: 0;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.22);
  display: flex; align-items: center; justify-content: center;
  color: #a78bfa;
}
.pb-body { flex: 1; min-width: 160px; }
.pb-title { font-size: 0.95rem; font-weight: 700; color: var(--text); margin-bottom: 0.3rem; }
.pb-text { font-size: 0.82rem; color: var(--text-soft); line-height: 1.55; }
.pb-cta {
  flex-shrink: 0;
  font-size: 0.82rem; font-weight: 700;
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.22);
  padding: 0.55rem 1.1rem;
  border-radius: 99px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}
.pb-cta:hover { background: rgba(139, 92, 246, 0.18); color: #c4b5fd; }

/* ── Grid ──────────────────────────────────────────────────────────────────── */
.catalogo-grid-section {
  background: var(--bg-surface);
  padding: 4rem 0 6rem;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ── Card ──────────────────────────────────────────────────────────────────── */
.producto-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  font-family: inherit;
  color: inherit;
}
.producto-card:hover {
  transform: translateY(-4px);
  border-color: rgba(34,211,238,0.3);
  box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(34,211,238,0.1);
}

.card-img-wrap {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--bg-elevated);
}
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.producto-card:hover .card-img { transform: scale(1.04); }

.card-img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--border);
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.card-footer {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-precio {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-soft);
}

.card-cta {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--cyan);
  transition: color 0.2s;
  white-space: nowrap;
}
.producto-card:hover .card-cta { color: var(--text); }

/* ── Estados ───────────────────────────────────────────────────────────────── */
.grid-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  height: 320px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 6rem 0;
  color: var(--border);
}
.empty-state p { font-size: 0.95rem; color: var(--text-muted); }

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .catalogo-hero { padding: 7rem 0 3rem; }
  .productos-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
}
@media (max-width: 400px) {
  .productos-grid { grid-template-columns: 1fr; }
}
</style>
