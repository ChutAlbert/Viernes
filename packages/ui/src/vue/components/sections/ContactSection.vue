<script setup lang="ts">
import { computed } from 'vue'
import { useContacts } from '../../composables/useWebsiteContent'

const { contacts } = useContacts()

const iconsByType: Record<string, string> = {
  phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.09 6.09l.9-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>`,
  email: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>`,
  whatsapp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.842L.057 23.57a.75.75 0 0 0 .916.916l5.728-1.47A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.516-5.155-1.416l-.37-.22-3.83.983.999-3.732-.24-.386A9.957 9.957 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`,
  other: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
}

const colorsByType: Record<string, string> = {
  phone: 'var(--cyan)',
  email: 'var(--amber)',
  whatsapp: '#22c55e',
  other: '#818cf8',
}

function getHref(contact: { contact_type: string; value: string }) {
  if (contact.contact_type === 'email') return `mailto:${contact.value}`
  if (contact.contact_type === 'phone') return `tel:${contact.value}`
  if (contact.contact_type === 'whatsapp') return `https://wa.me/${contact.value.replace(/\D/g, '')}`
  return contact.value
}

function getTarget(contact: { contact_type: string }) {
  if (contact.contact_type === 'email' || contact.contact_type === 'phone') return '_self'
  return '_blank'
}
</script>

<template>
  <section id="contact" class="contact-section">
    <div class="container">
      <div class="contact-inner">
        <!-- Header -->
        <div class="contact-header animate-on-scroll">
          <div class="section-tag">Hablemos</div>
          <h2 class="section-title">¿Tienes un <span class="highlight">proyecto</span>?</h2>
          <div class="section-divider"></div>
          <p class="section-subtitle">
            Escríbenos y cuéntanos tu idea. Estamos listos para convertirla en realidad.
          </p>
        </div>

        <!-- Contact cards -->
        <div class="contact-grid">
          <a
            v-for="(contact, i) in contacts"
            :key="contact.id"
            :href="getHref(contact)"
            :target="getTarget(contact)"
            rel="noopener"
            class="contact-card animate-on-scroll"
            :class="`delay-${i + 1}`"
            :style="{ '--contact-color': colorsByType[contact.contact_type] ?? 'var(--cyan)' }"
          >
            <div class="contact-icon" v-html="iconsByType[contact.contact_type] ?? iconsByType['other']"></div>
            <div class="contact-info">
              <span class="contact-label">{{ contact.label }}</span>
              <span class="contact-value">{{ contact.value }}</span>
            </div>
            <svg class="contact-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </a>

          <!-- Placeholder when empty -->
          <div v-if="contacts.length === 0" class="contact-placeholder">
            <p>Información de contacto próximamente.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom glow -->
    <div class="bottom-glow"></div>
  </section>
</template>

<style scoped>
.contact-section {
  background: var(--bg-surface);
  position: relative;
  overflow: hidden;
}

.contact-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: start;
}

.section-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 0.75rem;
}

.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  transition: var(--transition);
  cursor: pointer;
}
.contact-card:hover {
  border-color: var(--contact-color);
  background: var(--bg-elevated);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.contact-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius);
  background: rgba(255,255,255,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--contact-color);
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.06);
  transition: var(--transition);
}
.contact-card:hover .contact-icon {
  background: rgba(34, 211, 238, 0.1);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}
.contact-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.contact-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: var(--transition);
}
.contact-card:hover .contact-arrow {
  color: var(--contact-color);
  transform: translateX(3px);
}

.contact-placeholder {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.bottom-glow {
  position: absolute;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(34, 211, 238, 0.06), transparent 70%);
  pointer-events: none;
}

@media (max-width: 768px) {
  .contact-inner { grid-template-columns: 1fr; gap: 2.5rem; }
}
</style>
