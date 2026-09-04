<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Viewer3D from '@/components/Viewer3D.vue'
import {
  useProducto,
  useFilamentos,
  useRedes,
  archivoUrl,
  imagenUrl,
} from '@/composables/useCatalogo'
import { useSiteSettings } from '@viernes/ui/vue'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { producto, loading, error } = useProducto(slug)
const { filamentos } = useFilamentos()
const { redes } = useRedes()
const { settings } = useSiteSettings()
const galeriaActiva = ref<string | null>(null)

// ─── Selección del usuario ─────────────────────────────────────────────────
const selFilamentoId = ref<number | null>(null)

// Preselecciona el primer color disponible
watch(filamentos, (list) => {
  if (selFilamentoId.value === null && list.length > 0) selFilamentoId.value = list[0].id
}, { immediate: true })

// ─── Vista: fotos (por defecto) o modelo 3D ──────────────────────────────────
const vista = ref<'fotos' | '3d'>('fotos')
const fotoActivaIdx = ref(0)
const cargando3d = ref(false)

const fotos = computed(() => producto.value?.imagenes ?? [])
const hayFotos = computed(() => fotos.value.length > 0)
const hay3d = computed(() => !!producto.value?.archivo_3d_url)

// El visor 3D se habilita desde Dashboard -> Website -> Configuración
const ver3dActivo = computed(() => settings.value.ver_3d_activo !== 'false')
const puedeVer3d = computed(() => hay3d.value && ver3dActivo.value)

// Si la pieza no tiene fotos, arranca en 3D
watch(producto, () => {
  vista.value = hayFotos.value ? 'fotos' : '3d'
  fotoActivaIdx.value = 0
})

const fotoActivaUrl = computed(() => imagenUrl(fotos.value[fotoActivaIdx.value]?.url ?? null))

// ─── Carrusel automático ─────────────────────────────────────────────────────
const AUTOPLAY_MS = 4000
let timer: ReturnType<typeof setInterval> | null = null

function irA(i: number) {
  const n = fotos.value.length
  if (n === 0) return
  fotoActivaIdx.value = (i + n) % n
}
const siguiente = () => irA(fotoActivaIdx.value + 1)
const anterior  = () => irA(fotoActivaIdx.value - 1)

// Posición de cada foto respecto a la activa: 0 centro, ±1 laterales, resto oculta
function offsetDe(i: number): number {
  const n = fotos.value.length
  if (n === 0) return 0
  let d = i - fotoActivaIdx.value
  if (d > n / 2) d -= n            // envolvente, para que gire en círculo
  if (d < -n / 2) d += n
  return d
}

function estiloFoto(i: number) {
  const d = offsetDe(i)
  const abs = Math.abs(d)
  if (abs > 2) return { opacity: 0, pointerEvents: 'none' as const, transform: 'translateX(0) scale(0.4)' }
  return {
    transform: `translateX(${d * 46}%) scale(${abs === 0 ? 1 : abs === 1 ? 0.7 : 0.5}) rotateY(${d * -22}deg)`,
    zIndex: 10 - abs,
    opacity: abs === 0 ? 1 : abs === 1 ? 0.75 : 0.35,
    filter: abs === 0 ? 'none' : 'brightness(0.6)',
  }
}

function pararAuto() { if (timer) { clearInterval(timer); timer = null } }
function arrancarAuto() {
  pararAuto()
  if (vista.value === 'fotos' && fotos.value.length > 1) timer = setInterval(siguiente, AUTOPLAY_MS)
}

watch([vista, fotos], arrancarAuto, { immediate: true })
onUnmounted(pararAuto)

// ─── Filamento seleccionado ───────────────────────────────────────────────────
const filamentoSel = computed(() => {
  if (selFilamentoId.value === null) return null
  return filamentos.value.find(f => f.id === selFilamentoId.value) ?? null
})

// Archivo 3D: usa el específico del filamento si existe, sino el general
const archivo3dUrl = computed(() => {
  if (!producto.value) return null
  const url = producto.value.archivo_3d_url
  return archivoUrl(url)
})

// null = el visor muestra los colores originales del archivo
const colorHex = computed(() => filamentoSel.value?.hex_codigo ?? null)
const tipoMaterial = computed(() => filamentoSel.value?.tipo_material ?? 'PLA')

// Descripción de material visible
const descVisible = ref(new Set<string>())
function toggleDesc(tipo: string) {
  const next = new Set(descVisible.value)
  next.has(tipo) ? next.delete(tipo) : next.add(tipo)
  descVisible.value = next
}

const ORDEN_MATERIALES = ['PLA', 'PLA+', 'PETG', 'ASA', 'ABS', 'TPU', 'Resina']

// Agrupar filamentos por tipo_material en orden fijo
const filamentosAgrupados = computed(() => {
  const raw = filamentos.value.reduce((acc, f) => {
    const tipo = f.tipo_material
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(f)
    return acc
  }, {} as Record<string, typeof filamentos.value>)

  const ordered: Record<string, typeof filamentos.value> = {}
  ORDEN_MATERIALES.forEach(t => { if (raw[t]) ordered[t] = raw[t] })
  Object.keys(raw).forEach(t => { if (!ordered[t]) ordered[t] = raw[t] })
  return ordered
})

const MATERIAL_DESC: Record<string, string> = {
  'PLA':   'El plástico clásico para el hogar. Fácil de imprimir, colores vibrantes y acabado limpio. Perfecto para figuras decorativas, organizadores y piezas del día a día.',
  'PLA+':  'PLA de nueva generación: más resistente, menos frágil y mejor acabado que el PLA estándar. Ideal para piezas que necesitan aguantar más sin sacrificar calidad visual.',
  'PETG':  'Resistente al calor, la humedad y los golpes. El material para piezas funcionales que vivirán en cocina, baño o exteriores. Fuerte como el ABS, pero fácil de imprimir.',
  'ABS':   'El plástico duro de la industria. Soporta temperaturas altas e impactos fuertes. Perfecto para piezas mecánicas, automoción y entornos exigentes.',
  'ASA':   'Todo el rendimiento del ABS más resistencia UV superior. Diseñado para exteriores: no se amarilla ni se fragiliza con el sol aunque pase años a la intemperie.',
  'TPU':   'Filamento flexible y elástico, perfecto para fundas, amortiguadores y cualquier pieza que necesite doblarse sin romperse. Suave al tacto y muy duradero.',
  'Resina':'Máxima resolución de detalle. Para figuras de colección, miniaturas y piezas con texturas finas donde cada milímetro importa.',
}

function materialDesc(tipo: string): string {
  return MATERIAL_DESC[tipo] ?? `Material ${tipo}: resistente y versátil para una amplia variedad de aplicaciones.`
}

// Se activa/desactiva desde Dashboard -> Website -> Configuración
const solicitudActiva = computed(() => settings.value.solicitud_piezas_activa === 'true')

// Numero de WhatsApp. Aguanta tanto "+52 442..." como "https://wa.me/52442..."
const waNumero = computed(() => {
  const r = redes.value.find(x => x.icono === 'whatsapp' || /whats/i.test(x.nombre))
  const digitos = r?.url.replace(/\D/g, '') ?? ''
  return digitos.length >= 10 ? digitos : null
})

const ctaHint = computed(() =>
  vista.value === '3d' && filamentoSel.value
    ? 'Te abrimos WhatsApp con tu pieza y tu color ya escritos. Solo dale enviar.'
    : 'Te abrimos WhatsApp con tu pieza ya escrita. Solo dale enviar.'
)

const ctaTexto = computed(() => {
  if (waNumero.value) return solicitudActiva.value ? 'Solicitar por WhatsApp' : 'Escríbenos por WhatsApp'
  return solicitudActiva.value ? 'Solicitar esta pieza' : 'Ponte en contacto'
})

// Las demas redes: alternativa para quien no usa WhatsApp.
// ponytail: se abre su perfil y ya; solo WhatsApp acepta mensaje prellenado
const otrasRedes = computed(() =>
  redes.value.filter(r => !(waNumero.value && (r.icono === 'whatsapp' || /whats/i.test(r.nombre))))
)

const ctaUrl = computed(() => {
  if (!producto.value) return '/contacto'
  // El color solo lo eligio de verdad si estuvo en la vista 3D
  const color = vista.value === '3d' ? filamentoSel.value?.nombre : null
  if (waNumero.value) {
    const txt = `Hola, me interesa la pieza "${producto.value.nombre.trim()}"`
      + (color ? ` en ${color}` : '') + '.'
    return `https://wa.me/${waNumero.value}?text=${encodeURIComponent(txt)}`
  }
  if (!solicitudActiva.value) return '/contacto'
  const params = new URLSearchParams()
  params.set('pieza', producto.value.nombre)
  if (color) params.set('filamento', color)
  return `/contacto?${params.toString()}`
})
</script>

<template>
  <div class="producto-page">
    <div class="container back-bar">
      <button class="back-btn" @click="router.push('/catalogo')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Catálogo
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="container skeleton-layout">
      <div class="skeleton-viewer" /><div class="skeleton-panel"><div class="skeleton-line w-60"/><div class="skeleton-line w-40"/><div class="skeleton-line w-full"/></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="container empty-state">
      <p>Producto no encontrado.</p>
      <button class="btn btn-primary" @click="router.push('/catalogo')">Volver al catálogo</button>
    </div>

    <!-- Contenido -->
    <template v-else-if="producto">

      <!-- Nombre arriba -->
      <header class="container producto-head">
        <h1 class="product-name">{{ producto.nombre }}</h1>
        <p v-if="producto.descripcion" class="product-desc">{{ producto.descripcion }}</p>
      </header>

      <!-- Showcase a todo lo ancho: carrusel de fotos o visor 3D -->
      <section class="showcase" @mouseenter="pararAuto" @mouseleave="arrancarAuto">
        <!-- Coverflow -->
        <div v-if="vista === 'fotos' && hayFotos" class="coverflow">
          <div class="cf-escena">
            <div v-for="(img, i) in fotos" :key="img.id" class="cf-item" :style="estiloFoto(i)"
              @click="i === fotoActivaIdx ? (galeriaActiva = img.url) : irA(i)">
              <img :src="imagenUrl(img.url) ?? undefined" loading="lazy" />
            </div>
          </div>

          <template v-if="fotos.length > 1">
            <button class="carr-nav prev" @click.stop="anterior" aria-label="Anterior">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="carr-nav next" @click.stop="siguiente" aria-label="Siguiente">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <div class="carr-dots">
              <button v-for="(img, i) in fotos" :key="img.id" class="carr-dot"
                :class="{ active: i === fotoActivaIdx }" @click.stop="irA(i)" :aria-label="'Foto ' + (i + 1)" />
            </div>
          </template>
        </div>

        <!-- Visor 3D + colores al lado -->
        <div v-else class="container visor-layout">
          <div class="visor-box">
            <Viewer3D
              @loading="cargando3d = $event"
              :file-url="archivo3dUrl"
              :color="colorHex"
              :tipo-material="tipoMaterial"
              :tamano="1"
              :tamano-base="1"
            />
          </div>

          <aside class="colores-col" :class="{ cargando: cargando3d }" :aria-busy="cargando3d">
          <div class="config-block">
            <span class="block-label">Filamento</span>

            <div v-if="filamentos.length === 0" class="no-filamentos">
              Sin filamentos disponibles.
            </div>

            <div v-else class="filamentos-grupos">
              <div v-for="(grupo, tipo) in filamentosAgrupados" :key="tipo" class="grupo">
                <div class="grupo-header">
                  <p class="grupo-label">{{ tipo }}</p>
                  <button class="desc-toggle" :class="{ active: descVisible.has(tipo as string) }"
                    @click="toggleDesc(tipo as string)" :title="'¿Qué es ' + tipo + '?'">!</button>
                </div>
                <p v-if="descVisible.has(tipo as string)" class="grupo-desc">{{ materialDesc(tipo as string) }}</p>
                <!-- Nombre del color seleccionado en este grupo -->
                <p v-if="grupo.find(f => f.id === selFilamentoId)" class="color-sel-nombre">
                  {{ grupo.find(f => f.id === selFilamentoId)?.nombre }}
                </p>
                <div class="colores-dots">
                  <button
                    v-for="f in grupo"
                    :key="f.id"
                    class="color-dot"
                    :class="{ active: selFilamentoId === f.id }"
                    :style="{ '--dot-color': f.hex_codigo }"
                    :title="f.nombre"
                    @click="selFilamentoId = f.id"
                  />
                </div>
              </div>
            </div>

            <p class="nota-colores">
              {{ settings.catalogo_nota_colores || '¿No ves el color o material que buscas? Escríbenos y lo cotizamos.' }}
            </p>
          </div>
          </aside>
        </div>
      </section>

      <!-- Toggle debajo del showcase -->
      <div v-if="hayFotos && puedeVer3d" class="toggle-wrap">
        <div class="vista-toggle">
          <button :class="{ active: vista === 'fotos' }" @click="vista = 'fotos'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Fotos
          </button>
          <button :class="{ active: vista === '3d' }" @click="vista = '3d'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            Ver en 3D
          </button>
        </div>
      </div>

      <!-- Configuracion + accion -->
      <div class="container config-wrap">
        <p v-if="waNumero" class="cta-hint">
          {{ ctaHint }}
        </p>

        <a :href="ctaUrl" :target="waNumero ? '_blank' : undefined" rel="noopener"
           class="btn btn-primary cta-btn">
          <svg v-if="waNumero" width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          {{ ctaTexto }}
        </a>

        <p v-if="otrasRedes.length" class="cta-otras">
          ¿Prefieres otra red?
          <a v-for="r in otrasRedes" :key="r.id" :href="r.url" target="_blank" rel="noopener noreferrer">
            {{ r.nombre }}
          </a>
        </p>
      </div>
    </template>

  <!-- Lightbox -->
  <Transition name="lightbox-fade">
    <div v-if="galeriaActiva" class="lightbox" @click="galeriaActiva = null">
      <img :src="imagenUrl(galeriaActiva) ?? undefined" class="lightbox-img" @click.stop />
      <button class="lightbox-close" @click="galeriaActiva = null">×</button>
    </div>
  </Transition>
  </div>
</template>

<style scoped>
.producto-page { min-height: 100vh; background: var(--bg); padding-bottom: 6rem; }
.back-bar { padding: 6.5rem 1rem 1.5rem; }
.back-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.85rem; font-weight: 500; color: var(--text-soft);
  background: none; border: none; cursor: pointer; font-family: inherit; transition: color 0.2s;
}
.back-btn:hover { color: var(--cyan); }


/* ─── Showcase a todo lo ancho ─────────────────────────────────────────────── */
.showcase {
  position: relative;
  width: 100%;
  padding: 1rem 0 2.5rem;
  overflow: hidden;                     /* el coverflow no debe cortar el layout */
}
.toggle-wrap { display: flex; justify-content: center; margin-top: -0.5rem; margin-bottom: 2rem; }

.coverflow { position: relative; width: 100%; height: clamp(320px, 46vh, 520px); }
.cf-escena {
  position: relative; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  perspective: 1400px;
}
.cf-item {
  position: absolute;
  width: clamp(230px, 34vw, 400px);
  aspect-ratio: 1/1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-soft);
  background: var(--bg-card);
  cursor: pointer;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease, filter 0.45s ease;
  transform-style: preserve-3d;
  box-shadow: 0 24px 60px -20px rgba(0,0,0,0.65);
}
.cf-item img { width: 100%; height: 100%; object-fit: cover; display: block; }

.visor-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1.5rem; align-items: start; }
.visor-box {
  aspect-ratio: 4/3;
  border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-soft);
}
/* ponytail: max-height fijo en vez de igualar la altura del visor con JS */
.colores-col { max-height: min(60vh, 520px); overflow-y: auto; transition: opacity 0.2s; }
/* ponytail: el 3MF se parsea en el hilo principal y congela la pagina; avisar en vez de fingir que responde */
.colores-col.cargando { opacity: 0.4; pointer-events: none; }

/* ─── Info debajo del showcase ─────────────────────────────────────────────── */
.producto-head { text-align: center; padding: 0.5rem 0 1.5rem; }
.config-wrap { max-width: 620px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 3.5rem; }

@media (max-width: 900px) {
  .coverflow { height: clamp(260px, 40vh, 360px); }
  .visor-layout { grid-template-columns: 1fr; gap: 1rem; }
  .visor-box { aspect-ratio: 1/1; }
  .colores-col { max-height: 46vh; }
  .color-dot { width: 26px; height: 26px; }
  .colores-dots { gap: 0.4rem; }
  .filamentos-grupos { gap: 1rem; }
}


.viewer-box { position: relative; }
.foto-fade-enter-active, .foto-fade-leave-active { transition: opacity 0.4s ease; }
.foto-fade-enter-from, .foto-fade-leave-to { opacity: 0; }

.carr-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(5,13,31,0.55); border: 1px solid rgba(255,255,255,0.12);
  color: #fff; cursor: pointer; opacity: 0; transition: opacity 0.2s, background 0.2s;
}
.showcase:hover .carr-nav { opacity: 1; }
.carr-nav { opacity: 0.55; }
.carr-nav:hover { background: rgba(5,13,31,0.85); }
/* ponytail: ancladas al centro, no al viewport, para que sigan a la foto grande */
.carr-nav.prev { right: calc(50% + clamp(140px, 22vw, 250px)); }
.carr-nav.next { left:  calc(50% + clamp(140px, 22vw, 250px)); }

.carr-dots { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); display: flex; gap: 0.4rem; }
.carr-dot {
  width: 7px; height: 7px; border-radius: 50%; border: none; cursor: pointer; padding: 0;
  background: rgba(255,255,255,0.35); transition: all 0.2s;
}
.carr-dot.active { background: var(--cyan); width: 20px; border-radius: 99px; }

.vista-toggle { display: inline-flex; gap: 0.25rem; padding: 0.25rem; margin-bottom: 0.75rem; border-radius: 99px; background: var(--bg-card); border: 1px solid var(--border-soft); }
.vista-toggle button {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.9rem; border-radius: 99px; border: none; cursor: pointer;
  font-family: inherit; font-size: 0.78rem; font-weight: 600;
  background: transparent; color: var(--text-muted); transition: all 0.15s;
}
.vista-toggle button:hover { color: var(--text-soft); }
.vista-toggle button.active { background: rgba(34,211,238,0.12); color: var(--cyan); }

.product-name { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin-bottom: 0.5rem; }
.product-desc { font-size: 0.95rem; color: var(--text-soft); line-height: 1.7; max-width: 60ch; margin: 0 auto; }

.config-block { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: var(--radius); }
.block-header { display: flex; align-items: baseline; justify-content: space-between; }
.block-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-soft); }
.block-value { font-size: 0.95rem; font-weight: 700; color: var(--cyan); }


/* Multicolor */
.mc-switch { display: inline-flex; align-items: center; cursor: pointer; }
.mc-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.mc-switch-track { width: 40px; height: 22px; border-radius: 999px; background: var(--border-soft); position: relative; transition: background 0.15s; display: inline-block; }
.mc-switch input:checked + .mc-switch-track { background: var(--cyan); }
.mc-switch-thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left 0.15s; }
.mc-switch input:checked + .mc-switch-track .mc-switch-thumb { left: 20px; }
.mc-body { display: flex; flex-direction: column; gap: 0.5rem; }
.mc-stepper { display: inline-flex; align-items: center; gap: 0.75rem; }
.mc-stepper button { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border-soft); background: var(--bg-card); color: var(--text); font-size: 1.1rem; cursor: pointer; }
.mc-stepper button:disabled { opacity: 0.4; cursor: not-allowed; }
.mc-count-val { font-size: 1rem; font-weight: 700; color: var(--text); min-width: 20px; text-align: center; }
.mc-note { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }
.dimensiones-inputs { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.dim-input-wrap { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 90px; }
.dim-label { font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
.dim-field { display: flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.6rem; border-radius: 8px; background: rgba(34,211,238,0.06); border: 1.5px solid rgba(34,211,238,0.15); transition: border-color 0.2s; }
.dim-field:focus-within { border-color: var(--cyan); }
.dim-input {
  width: 100%; background: transparent; border: none; outline: none;
  color: var(--cyan); font-size: 0.88rem; font-weight: 700;
  font-family: inherit; text-align: right; min-width: 0;
  -moz-appearance: textfield;
}
.dim-input::-webkit-outer-spin-button,
.dim-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.dim-unit { font-size: 0.75rem; font-weight: 600; color: var(--cyan); opacity: 0.7; flex-shrink: 0; }

.size-slider { -webkit-appearance: none; width: 100%; height: 4px; background: var(--border); border-radius: 99px; outline: none; cursor: pointer; }
.size-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cyan); cursor: pointer; border: 2px solid var(--bg-card); box-shadow: 0 0 8px rgba(34,211,238,0.4); transition: transform 0.15s; }
.size-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
.slider-limits { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); }

/* Filamentos agrupados */
.filamentos-grupos { display: flex; flex-direction: column; gap: 1.25rem; }
.grupo-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.grupo-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
.desc-toggle {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  font-size: 0.65rem; font-weight: 800; font-family: serif; font-style: italic;
  border: 1.5px solid var(--border-soft); background: transparent;
  color: var(--text-muted); cursor: pointer; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.18s;
}
.desc-toggle:hover, .desc-toggle.active { border-color: var(--cyan); color: var(--cyan); background: rgba(34,211,238,0.08); }
.grupo-desc { font-size: 0.78rem; color: var(--text-soft); line-height: 1.55; margin-bottom: 0.5rem; }
.color-sel-nombre { font-size: 0.78rem; font-weight: 600; color: var(--cyan); margin-bottom: 0.4rem; min-height: 1.1em; }
.colores-dots { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.color-dot {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--dot-color, #888);
  border: 2.5px solid transparent;
  cursor: pointer; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  outline: none; position: relative;
}
.color-dot:hover:not(:disabled) { transform: scale(1.18); border-color: rgba(255,255,255,0.4); }
.color-dot.active { border-color: var(--cyan); box-shadow: 0 0 0 2px rgba(34,211,238,0.35); transform: scale(1.12); }
.color-dot.agotado { opacity: 0.45; cursor: pointer; }
.color-dot.agotado.active { border-color: rgba(139,92,246,0.6); box-shadow: 0 0 0 2px rgba(139,92,246,0.3); }
.color-dot.agotado::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(
    135deg,
    transparent calc(50% - 1px),
    #ef4444 calc(50% - 1px),
    #ef4444 calc(50% + 1px),
    transparent calc(50% + 1px)
  );
}

.agotado-aviso {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem; border-radius: var(--radius);
  background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
  font-size: 0.82rem; color: #f87171; font-weight: 500;
}
.cta-disabled { background: var(--border) !important; color: var(--text-muted) !important; cursor: not-allowed; opacity: 0.5; }

.no-filamentos { font-size: 0.85rem; color: var(--text-muted); }
.nota-colores {
  margin-top: 1rem; padding-top: 0.85rem;
  border-top: 1px solid var(--border-soft);
  font-size: 0.78rem; line-height: 1.6; color: var(--text-muted);
}

/* Multicolor */
.disabled-block { opacity: 0.5; pointer-events: none; }
.disabled-header { display: flex; align-items: center; gap: 0.5rem; }
.disabled-badge { margin-left: auto; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--amber); background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.2); padding: 0.2rem 0.6rem; border-radius: 99px; }
.disabled-msg { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }

/* Precio */
.precio-card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.precio-loading, .precio-error { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted); }
.precio-spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--cyan); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.precio-error { color: #f87171; }
.precio-display { display: flex; flex-direction: column; gap: 0.4rem; }
.precio-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 600; }
.precio-monto { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; background: linear-gradient(135deg, var(--cyan), var(--amber)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.desglose-toggle { align-self: flex-start; font-size: 0.78rem; color: var(--text-muted); background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; text-decoration: underline; transition: color 0.2s; }
.desglose-toggle:hover { color: var(--cyan); }
.desglose { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-soft); border-radius: var(--radius); }
.desglose-row { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-soft); }
.desglose-total { padding-top: 0.5rem; border-top: 1px solid var(--border-soft); font-weight: 700; color: var(--text); }
.precio-nota { font-size: 0.72rem; color: var(--text-muted); line-height: 1.5; }
.cta-hint {
  text-align: center; font-size: 0.85rem; color: var(--text-soft);
  line-height: 1.6; margin-bottom: -0.75rem;
}

.cta-otras {
  text-align: center; font-size: 0.82rem; color: var(--text-muted);
  display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;
  margin-top: -0.5rem;
}
.cta-otras a { color: var(--cyan); text-decoration: none; font-weight: 600; }
.cta-otras a:hover { text-decoration: underline; }

.cta-btn { align-self: center; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 2.25rem; font-size: 0.95rem; font-weight: 700; border-radius: 999px; }

/* Skeleton */
.skeleton-layout { display: grid; grid-template-columns: 1fr 420px; gap: 3rem; padding-top: 1.5rem; }
.skeleton-viewer { aspect-ratio: 1/1; border-radius: var(--radius-lg); background: var(--bg-card); animation: pulse 1.5s ease-in-out infinite; }
.skeleton-panel { display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem; }
.skeleton-line { height: 18px; border-radius: 6px; background: var(--bg-card); animation: pulse 1.5s ease-in-out infinite; }
.w-60 { width: 60%; } .w-40 { width: 40%; } .w-full { width: 100%; }
@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 8rem 0; text-align: center; color: var(--text-muted); }

.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }
.slide-enter-to, .slide-leave-from { max-height: 400px; }

/* Galería */
.galeria-section { margin-top: 1rem; }
.galeria-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.5rem; }
.galeria-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.5rem; }
.galeria-img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-soft); cursor: pointer; transition: border-color 0.2s; }
.galeria-img:hover { border-color: rgba(34,211,238,0.35); }
.galeria-img.active { border-color: var(--cyan); box-shadow: 0 0 0 1px var(--cyan); }

/* Lightbox */
.lightbox { position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; }
.lightbox-img { max-width: min(90vw, 860px); max-height: 88vh; border-radius: 12px; object-fit: contain; transition: transform 0.3s ease; }
.lightbox-close { position: absolute; top: 1.25rem; right: 1.5rem; font-size: 2rem; line-height: 1; background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; transition: color 0.15s; }
.lightbox-close:hover { color: #fff; }
.lightbox-fade-enter-active, .lightbox-fade-leave-active { transition: opacity 0.25s ease; }
.lightbox-fade-enter-active .lightbox-img, .lightbox-fade-enter-active .lightbox-close { transition: transform 0.3s ease, opacity 0.25s ease; }
.lightbox-fade-enter-from, .lightbox-fade-leave-to { opacity: 0; }
.lightbox-fade-enter-from .lightbox-img { transform: scale(0.92); }
.lightbox-fade-enter-to .lightbox-img { transform: scale(1); }

@media (max-width: 900px) {
  .viewer-col { position: static; }
  .viewer-box { aspect-ratio: 4/3; }
  .skeleton-layout { grid-template-columns: 1fr; }
}
</style>
