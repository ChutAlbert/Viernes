<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSiteSettings } from '../../composables/useWebsiteContent'

const { settings } = useSiteSettings()

// ── Canvas particles ──────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId = 0

interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; alpha: number; color: string
}

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  const particles: Particle[] = []
  const colors = ['#22d3ee', '#f59e0b', '#38bdf8', '#818cf8']

  function resize() {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Connect nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(34,211,238,${0.06 * (1 - dist / 120)})`
          ctx.lineWidth = 0.5
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0')
      ctx.fill()
    })

    animId = requestAnimationFrame(draw)
  }
  draw()

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
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

    <!-- Gradient orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="container hero-content">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        Disponible para nuevos proyectos
      </div>

      <h1 class="hero-title">
        <span class="hero-title-line reveal delay-0">{{ settings.hero_title.split(' ').slice(0, 2).join(' ') }}</span>
        <span class="hero-title-line highlight reveal delay-1">
          {{ settings.hero_title.split(' ').slice(2).join(' ') }}
        </span>
      </h1>

      <p class="hero-subtitle reveal delay-2">{{ settings.hero_subtitle }}</p>
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

      <!-- Stats -->
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

    <!-- Scroll indicator -->
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

/* Gradient orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  pointer-events: none;
}
.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  top: -200px; left: -200px;
  animation: float1 12s ease-in-out infinite;
}
.orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #f59e0b, transparent 70%);
  bottom: -150px; right: -100px;
  animation: float2 15s ease-in-out infinite;
}
.orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #818cf8, transparent 70%);
  top: 40%; left: 50%;
  animation: float3 10s ease-in-out infinite;
}

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

/* Content */
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 0.8rem;
  color: var(--text-soft);
  margin-bottom: 2rem;
  background: rgba(34, 211, 238, 0.04);
  animation: fade-in 0.6s ease forwards;
}
.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.hero-title {
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  margin-bottom: 1.25rem;
}
.hero-title-line {
  display: block;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--cyan);
  font-weight: 500;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}

.hero-desc {
  font-size: 1.05rem;
  color: var(--text-soft);
  max-width: 520px;
  margin-bottom: 2.5rem;
  line-height: 1.7;
}

/* Text reveal animation */
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

@keyframes fade-in {
  from { opacity: 0; } to { opacity: 1; }
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

@media (max-width: 640px) {
  .hero-stats { gap: 1.25rem; }
  .hero-actions { flex-direction: column; }
  .hero-actions .btn { justify-content: center; }
}
</style>
