<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useServices } from '../../composables/useWebsiteContent'

const { services, loading } = useServices()

const iconMap: Record<string, string> = {
  code: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>`,
  printer: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>`,
  layout: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  lightbulb: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 21h6M12 2a7 7 0 0 1 7 7c0 2.7-1.5 5-3.7 6.3L15 17H9l-.3-1.7A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/></svg>`,
  globe: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
  database: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
}

function getIcon(name: string) {
  return iconMap[name] ?? iconMap['code']
}

const categoryColors: Record<string, string> = {
  software: 'var(--cyan)',
  hardware: 'var(--amber)',
  design: '#818cf8',
  consulting: '#22c55e',
  general: 'var(--text-muted)',
}

function getCategoryColor(category: string) {
  return categoryColors[category] ?? categoryColors['general']
}

function scrollToContact() {
  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section id="services" class="services-section">
    <div class="container">
      <div class="section-header animate-on-scroll">
        <div class="section-tag">Lo que ofrecemos</div>
        <h2 class="section-title">Nuestros <span class="highlight">Servicios</span></h2>
        <div class="section-divider"></div>
        <p class="section-subtitle">
          Desde aplicaciones web a medida hasta prototipos físicos, llevamos tus proyectos de la idea a la realidad.
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="services-loading">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>

      <!-- Services grid -->
      <div v-else class="services-grid">
        <RouterLink
          v-for="(service, i) in services"
          :key="service.id"
          :to="service.slug ? `/servicios/${service.slug}` : '#services'"
          class="service-card card animate-on-scroll"
          :class="`delay-${(i % 4) + 1}`"
        >
          <div class="service-icon-wrap" :style="{ '--cat-color': getCategoryColor(service.category) }">
            <span class="service-icon" v-html="getIcon(service.icon)"></span>
          </div>
          <h3 class="service-title">{{ service.title }}</h3>
          <p class="service-desc">{{ service.description }}</p>
          <div class="service-footer">
            <div class="service-category">{{ service.category }}</div>
            <span class="service-arrow">Ver más →</span>
          </div>
        </RouterLink>
      </div>

      <!-- CTA -->
      <div class="services-cta animate-on-scroll">
        <p class="cta-text">¿No ves lo que necesitas? Hablemos de tu proyecto.</p>
        <a href="#contact" class="btn btn-primary" @click.prevent="scrollToContact">
          Cuéntanos tu idea
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.services-section { background: var(--bg); }

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

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}
.service-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  opacity: 0;
  transition: opacity 0.3s;
  background: radial-gradient(circle at top left, var(--cat-color, var(--cyan)) 0%, transparent 60%);
}
.service-card:hover::before { opacity: 0.06; }

.service-icon-wrap {
  width: 52px; height: 52px;
  border-radius: var(--radius);
  background: rgba(34, 211, 238, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cat-color, var(--cyan));
  border: 1px solid rgba(34, 211, 238, 0.12);
  transition: var(--transition);
}
.service-card:hover .service-icon-wrap {
  background: rgba(34, 211, 238, 0.14);
  transform: scale(1.05);
}

.service-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.service-desc {
  font-size: 0.9rem;
  color: var(--text-soft);
  line-height: 1.65;
  flex: 1;
}

.service-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.service-category {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cat-color, var(--cyan));
  font-weight: 600;
}

.service-arrow {
  font-size: 0.8rem;
  color: var(--text-muted);
  transition: color 0.2s, transform 0.2s;
}
.service-card:hover .service-arrow {
  color: var(--cyan);
  transform: translateX(3px);
}

/* Loading skeleton */
.services-loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}
.skeleton-card {
  height: 200px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* CTA */
.services-cta {
  text-align: center;
  padding: 2.5rem;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.cta-text {
  font-size: 1rem;
  color: var(--text-soft);
}
</style>
