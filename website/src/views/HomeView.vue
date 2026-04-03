<script setup lang="ts">
import { HeroSection, AboutSection, ServicesSection, ContactSection } from '@viernes/ui/vue'
import { useScrollAnimation } from '@viernes/ui/vue'

useScrollAnimation()
</script>

<template>
  <main>
    <HeroSection />
    <ServicesSection />
    <AboutSection />
    <ContactSection />
  </main>
</template>
