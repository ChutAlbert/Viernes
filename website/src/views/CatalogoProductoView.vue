<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Viewer3D from '@/components/Viewer3D.vue'
import {
  useProducto,
  calcularPrecio,
  archivoUrl,
  imagenUrl,
} from '@/composables/useCatalogo'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { producto, loading, error } = useProducto(slug)
const galeriaActiva = ref<string | null>(null)

// ─── Selección del usuario ─────────────────────────────────────────────────
const selFilamentoId = ref<number | null>(null)
const tamano         = ref(100)

// ─── Precio ───────────────────────────────────────────────────────────────────
const precio      = ref<number | null>(null)
const calcLoading = ref(false)
const calcError   = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Inicializar cuando carga el producto
watch(producto, (p) => {
  if (!p) return
  tamano.value = p.tamano_base_mm
  // Seleccionar primer filamento en stock, si no el primero
  const primero = p.filamentos.find(f => f.filamento.en_stock) ?? p.filamentos[0]
  if (primero) selFilamentoId.value = primero.filamento_id
}, { immediate: true })

// Recalcular precio al cambiar selección
watch([selFilamentoId, tamano], () => {
  if (!producto.value || selFilamentoId.value === null) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runCalculo, 400)
})

watch(producto, () => {
  if (!producto.value || selFilamentoId.value === null) return
  runCalculo()
})

async function runCalculo() {
  if (!producto.value || selFilamentoId.value === null) return
  calcLoading.value = true
  calcError.value = ''
  try {
    const res = await calcularPrecio({
      producto_id: producto.value!.id,
      filamento_id: selFilamentoId.value,
      tamano_mm: tamano.value,
      multicolor: false,
      num_colores: 1,
    })
    precio.value = res.precio_final
  } catch (e: unknown) {
    calcError.value = e instanceof Error ? e.message : 'Error al calcular'
  } finally {
    calcLoading.value = false
  }
}

// ─── Filamento seleccionado ───────────────────────────────────────────────────
const filamentoSel = computed(() => {
  if (!producto.value || selFilamentoId.value === null) return null
  return producto.value.filamentos.find(f => f.filamento_id === selFilamentoId.value) ?? null
})

// Archivo 3D: usa el específico del filamento si existe, sino el general
const archivo3dUrl = computed(() => {
  if (!producto.value) return null
  const url = filamentoSel.value?.archivo_3d_url || producto.value.archivo_3d_url
  return archivoUrl(url)
})

const colorHex = computed(() => filamentoSel.value?.filamento.hex_codigo ?? '#22d3ee')
const tipoMaterial = computed(() => filamentoSel.value?.filamento.tipo_material ?? 'PLA')
const filamentoAgotado = computed(() => filamentoSel.value?.filamento.en_stock === false)

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
  if (!producto.value) return {}
  const raw = producto.value.filamentos.reduce((acc, pf) => {
    const tipo = pf.filamento.tipo_material
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(pf)
    return acc
  }, {} as Record<string, typeof producto.value.filamentos>)

  const ordered: Record<string, typeof producto.value.filamentos> = {}
  ORDEN_MATERIALES.forEach(t => { if (raw[t]) ordered[t] = raw[t] })
  Object.keys(raw).forEach(t => { if (!ordered[t]) ordered[t] = raw[t] })
  return ordered
})

function formatPrecio(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

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

function formatTamano(mm: number): string {
  const cm = mm / 10
  return `${cm % 1 === 0 ? cm.toFixed(0) : cm.toFixed(1)} cm`
}

// Dimensiones escaladas con etiquetas
const scale = computed(() =>
  producto.value && producto.value.tamano_base_mm > 0
    ? tamano.value / producto.value.tamano_base_mm
    : 1
)

function fmtCm(mm: number) {
  const v = mm / 10
  return parseFloat((v % 1 < 0.05 || v % 1 > 0.95 ? v.toFixed(1) : v.toFixed(1)))
}

// Input ANCHO
const anchoCm = computed({
  get: () => fmtCm(tamano.value),
  set: (v: number) => {
    if (!producto.value) return
    const mm = Math.round(v * 10)
    tamano.value = Math.min(Math.max(mm, producto.value.tamano_minimo_mm), producto.value.tamano_maximo_mm)
  },
})

// Input LARGO (Y) — back-calculates slider from Y dimension
const largoCm = computed({
  get: () => producto.value?.tamano_y_mm
    ? fmtCm(producto.value.tamano_y_mm * scale.value)
    : null,
  set: (v: number) => {
    if (!producto.value?.tamano_y_mm) return
    const targetSlider = Math.round((v * 10 / producto.value.tamano_y_mm) * producto.value.tamano_base_mm)
    tamano.value = Math.min(Math.max(targetSlider, producto.value.tamano_minimo_mm), producto.value.tamano_maximo_mm)
  },
})

// Input ALTO (Z) — back-calculates slider from Z dimension (Z = height in 3D printing)
const altoCm = computed({
  get: () => producto.value?.tamano_z_mm
    ? fmtCm(producto.value.tamano_z_mm * scale.value)
    : null,
  set: (v: number) => {
    if (!producto.value?.tamano_z_mm) return
    const targetSlider = Math.round((v * 10 / producto.value.tamano_z_mm) * producto.value.tamano_base_mm)
    tamano.value = Math.min(Math.max(targetSlider, producto.value.tamano_minimo_mm), producto.value.tamano_maximo_mm)
  },
})

const ctaUrl = computed(() => {
  const params = new URLSearchParams()
  if (producto.value) params.set('pieza', producto.value.nombre)
  params.set('tamano', formatTamano(tamano.value))
  if (filamentoSel.value) params.set('filamento', filamentoSel.value.filamento.nombre)
  if (precio.value !== null) params.set('precio', formatPrecio(precio.value))
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
    <div v-else-if="producto" class="container producto-layout">

      <!-- Visor -->
      <div class="viewer-col">
        <div class="viewer-box">
          <Viewer3D
            :file-url="archivo3dUrl"
            :color="colorHex"
            :tipo-material="tipoMaterial"
            :tamano="tamano"
            :tamano-base="producto.tamano_base_mm"
          />
        </div>

        <!-- Galería de imágenes de ejemplo -->
        <div v-if="producto.imagenes && producto.imagenes.length > 0" class="galeria-section">
          <p class="galeria-label">Referencias e impresos</p>
          <div class="galeria-grid">
            <img
              v-for="img in producto.imagenes"
              :key="img.id"
              :src="imagenUrl(img.url) ?? undefined"
              class="galeria-img"
              loading="lazy"
              @click="galeriaActiva = img.url"
            />
          </div>
        </div>
      </div>

      <!-- Configurador -->
      <div class="config-col">
        <div class="config-header">
          <h1 class="product-name">{{ producto.nombre }}</h1>
          <p v-if="producto.descripcion" class="product-desc">{{ producto.descripcion }}</p>
        </div>

        <!-- Tamaño -->
        <div class="config-block">
          <span class="block-label">Tamaño</span>
          <div class="dimensiones-inputs">
            <!-- ANCHO siempre visible -->
            <div class="dim-input-wrap">
              <span class="dim-label">Ancho</span>
              <div class="dim-field">
                <input
                  type="number"
                  class="dim-input"
                  :min="producto.tamano_minimo_mm / 10"
                  :max="producto.tamano_maximo_mm / 10"
                  step="0.1"
                  :value="anchoCm"
                  @change="anchoCm = parseFloat(($event.target as HTMLInputElement).value) || anchoCm"
                />
                <span class="dim-unit">cm</span>
              </div>
            </div>
            <!-- LARGO (Y) -->
            <div v-if="largoCm !== null" class="dim-input-wrap">
              <span class="dim-label">Largo</span>
              <div class="dim-field">
                <input
                  type="number"
                  class="dim-input"
                  :min="(producto.tamano_minimo_mm / producto.tamano_base_mm * producto.tamano_y_mm!) / 10"
                  :max="(producto.tamano_maximo_mm / producto.tamano_base_mm * producto.tamano_y_mm!) / 10"
                  step="0.1"
                  :value="largoCm"
                  @change="largoCm = parseFloat(($event.target as HTMLInputElement).value) || largoCm"
                />
                <span class="dim-unit">cm</span>
              </div>
            </div>
            <!-- ALTO (Z) — Z es la altura en impresión 3D -->
            <div v-if="altoCm !== null" class="dim-input-wrap">
              <span class="dim-label">Alto</span>
              <div class="dim-field">
                <input
                  type="number"
                  class="dim-input"
                  :min="(producto.tamano_minimo_mm / producto.tamano_base_mm * producto.tamano_z_mm!) / 10"
                  :max="(producto.tamano_maximo_mm / producto.tamano_base_mm * producto.tamano_z_mm!) / 10"
                  step="0.1"
                  :value="altoCm"
                  @change="altoCm = parseFloat(($event.target as HTMLInputElement).value) || altoCm"
                />
                <span class="dim-unit">cm</span>
              </div>
            </div>
          </div>
          <input type="range" :min="producto.tamano_minimo_mm" :max="producto.tamano_maximo_mm" :step="1"
            v-model.number="tamano" class="size-slider" />
          <div class="slider-limits">
            <span>{{ formatTamano(producto.tamano_minimo_mm) }}</span>
            <span>{{ formatTamano(producto.tamano_maximo_mm) }}</span>
          </div>
        </div>

        <!-- Filamentos agrupados por tipo -->
        <div class="config-block">
          <span class="block-label">Filamento</span>

          <div v-if="producto.filamentos.length === 0" class="no-filamentos">
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
              <p v-if="grupo.find(pf => pf.filamento_id === selFilamentoId)" class="color-sel-nombre">
                {{ grupo.find(pf => pf.filamento_id === selFilamentoId)?.filamento.nombre }}
              </p>
              <div class="colores-dots">
                <button
                  v-for="pf in grupo"
                  :key="pf.filamento_id"
                  class="color-dot"
                  :class="{
                    active: selFilamentoId === pf.filamento_id,
                    agotado: !pf.filamento.en_stock,
                  }"
                  :style="{ '--dot-color': pf.filamento.hex_codigo }"
                  :title="pf.filamento.nombre + (!pf.filamento.en_stock ? ' · Agotado' : '')"
                  @click="selFilamentoId = pf.filamento_id"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Multicolor deshabilitado -->
        <div class="config-block disabled-block">
          <div class="disabled-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span class="block-label">Multicolor</span>
            <span class="disabled-badge">Próximamente</span>
          </div>
        </div>

        <!-- Precio -->
        <div class="precio-card">
          <div v-if="calcLoading" class="precio-loading">
            <div class="precio-spinner" /><span>Calculando…</span>
          </div>
          <div v-else-if="calcError" class="precio-error">{{ calcError }}</div>
          <div v-else-if="precio !== null" class="precio-display">
            <span class="precio-label">Precio estimado</span>
            <span class="precio-monto">{{ formatPrecio(precio) }}</span>
          </div>

          <p class="precio-nota">* Precio estimado. El costo final puede variar según complejidad de impresión.</p>
        </div>

        <div v-if="filamentoAgotado" class="agotado-aviso">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          Este color está agotado. Elige otro para continuar.
        </div>
        <a v-if="!filamentoAgotado" :href="ctaUrl" class="btn btn-primary cta-btn">Solicitar esta pieza</a>
        <button v-else class="btn cta-btn cta-disabled" disabled>Solicitar esta pieza</button>
      </div>
    </div>
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

.producto-layout { display: grid; grid-template-columns: 1fr 420px; gap: 3rem; align-items: start; }
.viewer-col { position: sticky; top: 5.5rem; }
.viewer-box { width: 100%; aspect-ratio: 1/1; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-soft); }

.config-col { display: flex; flex-direction: column; gap: 1.5rem; }
.product-name { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin-bottom: 0.5rem; }
.product-desc { font-size: 0.95rem; color: var(--text-soft); line-height: 1.7; }

.config-block { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: var(--radius); }
.block-header { display: flex; align-items: baseline; justify-content: space-between; }
.block-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-soft); }
.block-value { font-size: 0.95rem; font-weight: 700; color: var(--cyan); }
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
.cta-btn { width: 100%; text-align: center; padding: 0.9rem; font-size: 1rem; font-weight: 700; }

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
  .producto-layout { grid-template-columns: 1fr; }
  .viewer-col { position: static; }
  .viewer-box { aspect-ratio: 4/3; }
  .skeleton-layout { grid-template-columns: 1fr; }
}
</style>
