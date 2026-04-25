<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSiteSettings } from '../../composables/useWebsiteContent'

const { settings } = useSiteSettings()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId = 0
const isLight = ref(false)

function checkTheme() {
  isLight.value = document.documentElement.classList.contains('light')
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; alpha: number; color: string
}

onMounted(() => {
  checkTheme()

  const observer = new MutationObserver(checkTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  const particles: Particle[] = []

  function getDarkColors() { return ['#22d3ee', '#f59e0b', '#38bdf8', '#818cf8'] }
  function getLightColors() { return ['#0891b2', '#0369a1', '#6366f1', '#0d9488'] }

  function resize() {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const colors = getDarkColors()
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.05,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const light = isLight.value
    const lineRgb = light ? '8,145,178' : '34,211,238'
    const lineBaseOpacity = light ? 0.03 : 0.06

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${lineRgb},${lineBaseOpacity * (1 - dist / 120)})`
          ctx.lineWidth = 0.5
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    const newColors = light ? getLightColors() : getDarkColors()
    particles.forEach((p, idx) => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      if (idx % 10 === 0) p.color = newColors[idx % newColors.length]

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      const alpha = light ? p.alpha * 0.6 : p.alpha
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      ctx.fill()
    })

    animId = requestAnimationFrame(draw)
  }
  draw()

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
    observer.disconnect()
  })
})

function scrollDown() {
  document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })
}

function scrollToContact() {
  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section id="home" class="hero">
    <canvas ref="canvasRef" class="hero-canvas"></canvas>

    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="container hero-layout">
      <!-- Left column: content -->
      <div class="hero-content">
        <div class="hero-pills reveal delay-0">
          <span class="pill pill-software">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3 5L1 6.5 3 8M10 5l2 1.5L10 8M7.5 2.5l-2 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            Software
          </span>
          <span class="pill pill-3d">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l6 3.5v5L7 13 1 9.5v-5L7 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            Impresión 3D
          </span>
        </div>

        <h1 class="hero-title">
          <span class="hero-title-line reveal delay-1">{{ settings.hero_title.split(' ').slice(0, 2).join(' ') }}</span>
          <span class="hero-title-line highlight reveal delay-2">
            {{ settings.hero_title.split(' ').slice(2).join(' ') }}
          </span>
        </h1>

        <p class="hero-desc reveal delay-3">{{ settings.hero_description }}</p>

        <div class="hero-actions reveal delay-4">
          <button class="btn btn-primary" @click="scrollDown">
            Ver Servicios
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <a href="#contact" class="btn btn-outline" @click.prevent="scrollToContact">
            Contáctanos
          </a>
        </div>

        <div class="hero-stats reveal delay-4">
          <div class="stat">
            <span class="stat-value">100%</span>
            <span class="stat-label">A medida</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">3D</span>
            <span class="stat-label">Impresión propia</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">∞</span>
            <span class="stat-label">Posibilidades</span>
          </div>
        </div>
      </div>

      <!-- Right column: floating service cards -->
      <div class="hero-visual reveal delay-3">
        <div class="visual-card card-software">
          <div class="vc-icon vc-icon-software">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M7 9L2 13l5 4M19 9l5 4-5 4M15.5 5l-5 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="vc-body">
            <h3>Desarrollo de Software</h3>
            <p>Apps web y sistemas a medida para tu negocio.</p>
            <div class="vc-tags">
              <span>Web</span><span>API</span>
            </div>
          </div>
        </div>

        <div class="visual-card card-3d">
          <div class="vc-icon vc-icon-3d">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 2l11 6.5v9L13 24 2 17.5v-9L13 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M13 2v22M2 8.5l11 6.5 11-6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="vc-body">
            <h3>Impresión 3D</h3>
            <p>Prototipos y piezas personalizadas con tecnología propia.</p>
            <div class="vc-tags">
              <span>FDM</span><span>Resina</span><span>Color</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="scroll-indicator" @click="scrollDown">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 6rem 0 4rem;
}

.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  top: -200px; left: -200px;
  opacity: 0.12;
  animation: float1 12s ease-in-out infinite;
}
.orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #f59e0b, transparent 70%);
  bottom: -150px; right: -100px;
  opacity: 0.1;
  animation: float2 15s ease-in-out infinite;
}
.orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #818cf8, transparent 70%);
  top: 40%; left: 50%;
  opacity: 0.07;
  animation: float3 10s ease-in-out infinite;
}

:root.light .orb-1 { opacity: 0.05; }
:root.light .orb-2 { opacity: 0.04; }
:root.light .orb-3 { opacity: 0.03; }

@keyframes float1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(60px, 40px); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-40px, -60px); }
}
@keyframes float3 {
  0%, 100% { transform: translate(-50%, -50%); }
  50% { transform: translate(-50%, calc(-50% + 30px)); }
}

/* Two-column layout */
.hero-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content { max-width: 580px; }

/* Service pills */
.hero-pills {
  display: flex;
  gap: 0.65rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.875rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.pill-software {
  background: rgba(34, 211, 238, 0.1);
  color: var(--cyan);
  border: 1px solid rgba(34, 211, 238, 0.22);
}
.pill-3d {
  background: rgba(245, 158, 11, 0.1);
  color: var(--amber);
  border: 1px solid rgba(245, 158, 11, 0.22);
}

:root.light .pill-software {
  background: rgba(8, 145, 178, 0.08);
  border-color: rgba(8, 145, 178, 0.28);
}
:root.light .pill-3d {
  background: rgba(217, 119, 6, 0.08);
  border-color: rgba(217, 119, 6, 0.28);
}

.hero-title {
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  margin-bottom: 1.25rem;
}
.hero-title-line { display: block; }

.hero-desc {
  font-size: 1.05rem;
  color: var(--text-soft);
  max-width: 480px;
  margin-bottom: 2.5rem;
  line-height: 1.7;
}

.reveal {
  opacity: 0;
  transform: translateY(24px);
  animation: reveal-up 0.7s ease forwards;
}
.delay-0 { animation-delay: 0.2s; }
.delay-1 { animation-delay: 0.35s; }
.delay-2 { animation-delay: 0.5s; }
.delay-3 { animation-delay: 0.65s; }
.delay-4 { animation-delay: 0.8s; }

@keyframes reveal-up {
  to { opacity: 1; transform: translateY(0); }
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 3.5rem;
}

/* Stats */
.hero-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--border-soft);
}
.stat { text-align: center; }
.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--cyan), var(--amber));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-label { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
.stat-divider { width: 1px; height: 36px; background: var(--border-soft); }

/* Visual cards */
.hero-visual {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.visual-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1.1rem;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.visual-card::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: inherit;
  pointer-events: none;
}

.card-software::after {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.05), transparent 60%);
}
.card-3d::after {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent 60%);
}

.visual-card:hover::after { opacity: 1; }

.card-software:hover {
  border-color: rgba(34, 211, 238, 0.3);
  box-shadow: 0 8px 32px rgba(34, 211, 238, 0.12);
  transform: translateY(-3px);
}
.card-3d:hover {
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.12);
  transform: translateY(-3px);
}

:global(:root.light) .visual-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
:global(:root.light) .card-software:hover {
  box-shadow: 0 8px 28px rgba(8, 145, 178, 0.14);
}
:global(:root.light) .card-3d:hover {
  box-shadow: 0 8px 28px rgba(217, 119, 6, 0.14);
}

.vc-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vc-icon-software {
  background: rgba(34, 211, 238, 0.1);
  color: var(--cyan);
  border: 1px solid rgba(34, 211, 238, 0.15);
}
.vc-icon-3d {
  background: rgba(245, 158, 11, 0.1);
  color: var(--amber);
  border: 1px solid rgba(245, 158, 11, 0.15);
}

:global(:root.light) .vc-icon-software {
  background: rgba(8, 145, 178, 0.09);
  border-color: rgba(8, 145, 178, 0.2);
}
:global(:root.light) .vc-icon-3d {
  background: rgba(217, 119, 6, 0.09);
  border-color: rgba(217, 119, 6, 0.2);
}

.vc-body { flex: 1; }
.vc-body h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.3rem;
  line-height: 1.3;
}
.vc-body p {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.55;
  margin-bottom: 0.75rem;
}

.vc-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.vc-tags span {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--bg-elevated);
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  animation: bounce 2s ease-in-out infinite;
  transition: border-color 0.3s, color 0.3s;
  z-index: 1;
}
.scroll-indicator:hover { border-color: var(--cyan); color: var(--cyan); }

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(6px); }
}

@media (max-width: 960px) {
  .hero-layout {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .hero-visual {
    flex-direction: row;
  }
  .visual-card { flex: 1; }
}

@media (max-width: 640px) {
  .hero-stats { gap: 1.25rem; }
  .hero-actions { flex-direction: column; }
  .hero-actions .btn { justify-content: center; }
  .hero-visual { flex-direction: column; }
}
</style>
