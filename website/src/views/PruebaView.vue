<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ponytail: maxTouchPoints detecta hardware táctil incluso en "modo desktop"
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = navigator.maxTouchPoints > 0
})
</script>

<template>
  <main class="prueba-page">
    <section v-if="!isMobile" class="desktop-only">
      <h2>Esta sección solo aparece en desktop real</h2>
      <p>Si estás en un celular (aunque uses modo desktop), no puedes ver esto.</p>
    </section>

    <button :disabled="isMobile" :class="{ 'no-click': isMobile }">
      {{ isMobile ? 'No soy clickeable' : 'Soy clickeable' }}
    </button>
  </main>
</template>

<style scoped>
.prueba-page {
  padding: 8rem 2rem 2rem;
}

.desktop-only {
  background: #e0f2fe;
  color: #0f172a;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #06b6d4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.no-click {
  background: #94a3b8;
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
