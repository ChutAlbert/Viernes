<script setup lang="ts">
import { watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServiceBySlug } from '@viernes/ui/vue'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { service, loading, notFound } = useServiceBySlug(slug)

// Re-run scroll animation after service data loads
watch(service, async () => {
  await nextTick()
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.08 }
  )
  document.querySelectorAll('.animate-on-scroll:not(.is-visible)').forEach((el) => observer.observe(el))
})

const iconMap: Record<string, string> = {
  code: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>`,
  printer: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>`,
  layout: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  lightbulb: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 21h6M12 2a7 7 0 0 1 7 7c0 2.7-1.5 5-3.7 6.3L15 17H9l-.3-1.7A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/></svg>`,
  globe: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
  database: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
}

const categoryColors: Record<string, string> = {
  software: '#22d3ee',
  hardware: '#f59e0b',
  design: '#818cf8',
  consulting: '#22c55e',
  general: '#64748b',
}

function getIcon(name: string) {
  return iconMap[name] ?? iconMap['code']
}

function getCategoryColor(category: string) {
  return categoryColors[category] ?? categoryColors['general']
}

function scrollToContact() {
  router.push('/#contact')
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="detail-loading">
    <div class="container">
      <div class="skeleton-hero"></div>
      <div class="skeleton-body"></div>
    </div>
  </div>

  <!-- Not found -->
  <div v-else-if="notFound" class="not-found">
    <div class="container">
      <h1>Servicio no encontrado</h1>
      <p>El servicio que buscas no existe o fue desactivado.</p>
      <router-link to="/" class="btn btn-primary">Volver al inicio</router-link>
    </div>
  </div>

  <!-- Detail page -->
  <div v-else-if="service" class="service-detail">
    <!-- Hero -->
    <section class="detail-hero">
      <div class="container">
        <router-link to="/#services" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Todos los servicios
        </router-link>

        <div class="hero-content">
          <div class="hero-icon" :style="{ '--cat-color': getCategoryColor(service.category) }">
            <span v-html="getIcon(service.icon)"></span>
          </div>
          <div class="hero-text">
            <div class="category-tag" :style="{ color: getCategoryColor(service.category) }">
              {{ service.category }}
            </div>
            <h1 class="hero-title">{{ service.title }}</h1>
            <p class="hero-desc">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Images gallery -->
    <section v-if="service.image_urls && service.image_urls.length" class="gallery-section">
      <div class="container">
        <div class="gallery-grid" :class="`cols-${Math.min(service.image_urls.length, 3)}`">
          <div
            v-for="(url, i) in service.image_urls"
            :key="i"
            class="gallery-item animate-on-scroll"
            :class="`delay-${(i % 3) + 1}`"
          >
            <img :src="url" :alt="`${service.title} imagen ${i + 1}`" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- Long description -->
    <section v-if="service.long_description" class="content-section">
      <div class="container">
        <div class="content-grid">
          <div class="content-body">
            <h2 class="content-title">Acerca de este servicio</h2>
            <div class="section-divider"></div>
            <div class="long-desc">
              <p v-for="(paragraph, i) in service.long_description.split('\n').filter(p => p.trim())" :key="i">
                {{ paragraph }}
              </p>
            </div>
          </div>
          <div class="content-aside">
            <div class="card aside-card">
              <h3>¿Interesado?</h3>
              <p>Cuéntanos sobre tu proyecto y te daremos una propuesta personalizada.</p>
              <button class="btn btn-primary" @click="scrollToContact">
                Contactar ahora
              </button>
              <router-link to="/" class="btn btn-outline">Ver más servicios</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA if no long description -->
    <section v-else class="cta-section">
      <div class="container">
        <div class="card cta-card">
          <h2>¿Te interesa este servicio?</h2>
          <p>Cuéntanos sobre tu proyecto y construimos algo juntos.</p>
          <div class="cta-buttons">
            <button class="btn btn-primary" @click="scrollToContact">Contactar ahora</button>
            <router-link to="/" class="btn btn-outline">Ver más servicios</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Hero ──────────────────────────────────────────────────────────────────── */
.detail-hero {
  background: var(--bg);
  padding: 7rem 0 4rem;
  border-bottom: 1px solid var(--border-soft);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-soft);
  font-size: 0.875rem;
  margin-bottom: 2.5rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--cyan); }

.hero-content {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  background: rgba(34, 211, 238, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cat-color, var(--cyan));
  flex-shrink: 0;
}

.category-tag {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  line-height: 1.15;
  margin-bottom: 1rem;
}

.hero-desc {
  font-size: 1.15rem;
  color: var(--text-soft);
  line-height: 1.7;
  max-width: 640px;
}

/* ── Gallery ───────────────────────────────────────────────────────────────── */
.gallery-section { background: var(--bg-surface); padding: 4rem 0; }

.gallery-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}
.gallery-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
.gallery-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }

.gallery-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-soft);
  aspect-ratio: 16/9;
  background: var(--bg-card);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.gallery-item:hover img { transform: scale(1.03); }

/* ── Content ───────────────────────────────────────────────────────────────── */
.content-section { background: var(--bg); padding: 5rem 0; }

.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 4rem;
  align-items: start;
}

.content-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text);
}

.long-desc {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.long-desc p {
  font-size: 1rem;
  color: var(--text-soft);
  line-height: 1.8;
}

.aside-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 2rem;
}
.aside-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}
.aside-card p {
  font-size: 0.9rem;
  color: var(--text-soft);
  line-height: 1.6;
}

/* ── CTA ───────────────────────────────────────────────────────────────────── */
.cta-section { background: var(--bg-surface); padding: 5rem 0; }

.cta-card {
  text-align: center;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}
.cta-card h2 { font-size: 1.8rem; color: var(--text); }
.cta-card p { color: var(--text-soft); max-width: 480px; }

.cta-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Loading / Not found ───────────────────────────────────────────────────── */
.detail-loading, .not-found { padding: 6rem 0; text-align: center; }
.skeleton-hero {
  height: 200px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton-body {
  height: 400px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.not-found h1 { font-size: 2rem; margin-bottom: 1rem; }
.not-found p { color: var(--text-soft); margin-bottom: 2rem; }

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .hero-content { flex-direction: column; }
  .content-grid { grid-template-columns: 1fr; }
  .gallery-grid.cols-2,
  .gallery-grid.cols-3 { grid-template-columns: 1fr; }
  .content-aside { position: static; }
}
</style>
