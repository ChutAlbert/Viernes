<script setup lang="ts">
import { HeroSection, AboutSection, ServicesSection, ContactSection, WorksSection } from '@viernes/ui/vue'
import { useScrollAnimation } from '@viernes/ui/vue'
import CatalogoPreview from '@/components/CatalogoPreview.vue'

useScrollAnimation()
</script>

<template>
  <main>
    <HeroSection />
    <ServicesSection />
    <CatalogoPreview />
    <WorksSection />
    <AboutSection />
    <ContactSection />
  </main>
</template>
