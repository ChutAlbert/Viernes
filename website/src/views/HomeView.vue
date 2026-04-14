<script setup lang="ts">
import { HeroSection, AboutSection, ServicesSection, ContactSection, WorksSection } from '@viernes/ui/vue'
import { useScrollAnimation } from '@viernes/ui/vue'

useScrollAnimation()
</script>

<template>
  <main>
    <HeroSection />
    <ServicesSection />
    <WorksSection />
    <AboutSection />
    <ContactSection />
  </main>
</template>
