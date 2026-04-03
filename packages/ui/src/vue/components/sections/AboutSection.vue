<script setup lang="ts">
import { useMembers } from '../../composables/useWebsiteContent'

const { members } = useMembers()

const skills = [
  { label: 'Vue / React / TypeScript', icon: '⚡' },
  { label: 'Python / FastAPI', icon: '🐍' },
  { label: 'Impresión 3D', icon: '🖨️' },
  { label: 'Diseño UI/UX', icon: '🎨' },
  { label: 'Bases de datos', icon: '🗄️' },
  { label: 'Docker / DevOps', icon: '🐳' },
]
</script>

<template>
  <section id="about" class="about-section">
    <div class="container">
      <div class="section-header animate-on-scroll">
        <div class="section-tag">Quiénes somos</div>
        <h2 class="section-title">Somos <span class="highlight">devs</span> apasionados</h2>
        <div class="section-divider"></div>
        <p class="section-subtitle">
          Construimos soluciones digitales y físicas con atención al detalle y enfoque en resultados reales.
        </p>
      </div>

      <!-- Team grid -->
      <div class="team-grid">
        <div
          v-for="(member, i) in members"
          :key="member.id"
          class="member-card card animate-on-scroll"
          :class="`delay-${i + 1}`"
        >
          <div class="member-avatar">
            <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" />
            <div v-else class="avatar-placeholder">
              {{ member.name.slice(0, 2).toUpperCase() }}
            </div>
          </div>
          <h3 class="member-name">{{ member.name }}</h3>
          <p class="member-role">{{ member.role }}</p>
          <p v-if="member.bio" class="member-bio">{{ member.bio }}</p>
          <div class="member-links">
            <a v-if="member.github_url" :href="member.github_url" target="_blank" rel="noopener" class="social-link" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>
            <a v-if="member.linkedin_url" :href="member.linkedin_url" target="_blank" rel="noopener" class="social-link" title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Placeholder cuando no hay miembros del API aún -->
        <div v-if="members.length === 0" class="member-card card animate-on-scroll delay-1">
          <div class="member-avatar">
            <div class="avatar-placeholder">JH</div>
          </div>
          <h3 class="member-name">Jesus Hernandez</h3>
          <p class="member-role">Full Stack Developer · 3D</p>
          <p class="member-bio">Desarrollador apasionado por crear soluciones digitales únicas y llevarlas al mundo físico.</p>
          <div class="member-links"></div>
        </div>
      </div>

      <!-- Skills -->
      <div class="skills-section animate-on-scroll delay-2">
        <h3 class="skills-title">Nuestro stack</h3>
        <div class="skills-grid">
          <div v-for="skill in skills" :key="skill.label" class="skill-pill">
            <span>{{ skill.icon }}</span>
            {{ skill.label }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-section { background: var(--bg-surface); }

.section-header { margin-bottom: 3.5rem; }
.section-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 0.75rem;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

.member-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.member-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border);
  margin-bottom: 0.5rem;
}
.member-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, var(--cyan-dim), var(--bg-elevated));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--cyan);
}

.member-name { font-size: 1.1rem; font-weight: 700; }
.member-role { font-size: 0.85rem; color: var(--cyan); font-weight: 500; }
.member-bio { font-size: 0.88rem; color: var(--text-soft); line-height: 1.6; max-width: 280px; }

.member-links {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.social-link {
  color: var(--text-muted);
  transition: color 0.2s;
  display: flex;
}
.social-link:hover { color: var(--cyan); }

/* Skills */
.skills-section { border-top: 1px solid var(--border-soft); padding-top: 2.5rem; }
.skills-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-soft);
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
}
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.skill-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 99px;
  font-size: 0.88rem;
  color: var(--text-soft);
  transition: var(--transition);
}
.skill-pill:hover { border-color: var(--cyan-dim); color: var(--text); }
</style>
