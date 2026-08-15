<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TheNavbar, TheFooter } from '@viernes/ui/vue'

const maintenance = ref(false)
const checked = ref(false)
const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

onMounted(async () => {
  // URL mágica: tusitio.com/?owner=1 marca este dispositivo como dueño
  const params = new URLSearchParams(window.location.search)
  if (params.get('owner') === '1') {
    localStorage.setItem('viernes_owner', '1')
    params.delete('owner')
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', newUrl)
  }

  const isOwner = !!localStorage.getItem('viernes_token') || localStorage.getItem('viernes_owner') === '1'

  // Modo mantenimiento (el dueño lo ve normal)
  try {
    const res = await fetch(`${apiBase}/website/settings`)
    if (res.ok) {
      const list = await res.json()
      const m = Array.isArray(list) ? list.find((s: { key: string; value: string }) => s.key === 'maintenance_mode') : null
      if (m && m.value === 'true' && !isOwner) maintenance.value = true
    }
  } catch { /* si el backend no responde, no bloqueamos el sitio */ }
  checked.value = true

  // No registrar visitas del dueño
  if (isOwner) return
  fetch(`${apiBase}/api/visits`, {
    method: 'POST',
    headers: { 'X-Page-Path': window.location.pathname },
  }).catch(() => {/* silencioso si el backend no está disponible */})
})
</script>

<template>
  <!-- Splash breve mientras se verifica mantenimiento (evita el flash del sitio real) -->
  <div v-if="!checked" class="mt-splash" />

  <!-- Pantalla de mantenimiento -->
  <div v-else-if="maintenance" class="mt-screen">
    <div class="mt-card">
      <div class="mt-logo">S</div>
      <h1>Volvemos pronto</h1>
      <p>Sodigic está en mantenimiento. Estamos mejorando el sitio — vuelve en un rato.</p>
    </div>
  </div>

  <!-- Sitio normal -->
  <template v-else>
    <TheNavbar />
    <RouterView />
    <TheFooter />
  </template>
</template>

<style scoped>
.mt-splash { min-height: 100vh; background: #050d1f; }

.mt-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse at 30% 20%, #0f2744, #050d1f);
}
.mt-card { max-width: 460px; text-align: center; }
.mt-logo {
  width: 56px; height: 56px; border-radius: 16px;
  margin: 0 auto 1.5rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
}
.mt-card h1 { font-size: 1.85rem; font-weight: 800; color: #e6f6fb; margin: 0 0 0.75rem; letter-spacing: -0.02em; }
.mt-card p { font-size: 1rem; color: #9db8cc; line-height: 1.6; margin: 0; }
</style>
