<script setup lang="ts">
import { onMounted } from 'vue'
import { TheNavbar, TheFooter } from '@viernes/ui/vue'

onMounted(() => {
  // URL mágica: tusitio.com/?owner=1 marca este dispositivo y limpia el parámetro
  const params = new URLSearchParams(window.location.search)
  if (params.get('owner') === '1') {
    localStorage.setItem('viernes_owner', '1')
    params.delete('owner')
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', newUrl)
  }

  // No registrar visitas del dueño del sitio
  if (localStorage.getItem('viernes_token')) return       // sesión activa en dashboard
  if (localStorage.getItem('viernes_owner') === '1') return  // dispositivo marcado

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  fetch(`${apiBase}/api/visits`, {
    method: 'POST',
    headers: {
      'X-Page-Path': window.location.pathname,
    },
  }).catch(() => {/* silencioso si el backend no está disponible */})
})
</script>

<template>
  <TheNavbar />
  <RouterView />
  <TheFooter />
</template>
