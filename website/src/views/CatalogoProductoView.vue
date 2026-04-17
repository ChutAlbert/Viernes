<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Viewer3D from '@/components/Viewer3D.vue'
import {
  useProducto,
  calcularPrecio,
  archivoUrl,
} from '@/composables/useCatalogo'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { producto, loading, error } = useProducto(slug)

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

// Agrupar filamentos por tipo_material para mostrarlos agrupados
const filamentosAgrupados = computed(() => {
  if (!producto.value) return {}
  return producto.value.filamentos.reduce((acc, pf) => {
    const tipo = pf.filamento.tipo_material
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(pf)
    return acc
  }, {} as Record<string, typeof producto.value.filamentos>)
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

const tamanoCm = computed({
  get: () => parseFloat((tamano.value / 10).toFixed(1)),
  set: (cm: number) => {
    const mm = Math.round(cm * 10)
    const min = producto.value?.tamano_minimo_mm ?? mm
    const max = producto.value?.tamano_maximo_mm ?? mm
    tamano.value = Math.min(Math.max(mm, min), max)
  },
})

// Dimensiones escaladas con etiquetas
const dimensiones = computed(() => {
  if (!producto.value) return null
  const scale = producto.value.tamano_base_mm > 0 ? tamano.value / producto.value.tamano_base_mm : 1
  const fmt = (v: number) => (v % 1 < 0.05 || v % 1 > 0.95 ? v.toFixed(0) : v.toFixed(1)) + ' cm'
  const items: { label: string; value: string }[] = [
    { label: 'Ancho', value: fmt(tamano.value / 10) },
  ]
  if (producto.value.tamano_y_mm)
    items.push({ label: 'Alto',  value: fmt((producto.value.tamano_y_mm * scale) / 10) })
  if (producto.value.tamano_z_mm)
    items.push({ label: 'Largo', value: fmt((producto.value.tamano_z_mm * scale) / 10) })
  return items
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
      </div>

      <!-- Configurador -->
      <div class="config-col">
        <div class="config-header">
          <h1 class="product-name">{{ producto.nombre }}</h1>
          <p v-if="producto.descripcion" class="product-desc">{{ producto.descripcion }}</p>
        </div>

        <!-- Tamaño -->
        <div class="config-block">
          <div class="block-header">
            <span class="block-label">Tamaño</span>
            <div class="tamano-input-wrap">
              <input
                type="number"
                class="tamano-input"
                :min="producto.tamano_minimo_mm / 10"
                :max="producto.tamano_maximo_mm / 10"
                step="0.1"
                :value="tamanoCm"
                @change="tamanoCm = parseFloat(($event.target as HTMLInputElement).value) || tamanoCm"
              />
              <span class="tamano-unit">cm</span>
            </div>
          </div>
          <div v-if="dimensiones && dimensiones.length > 1" class="dimensiones-chips">
            <div v-for="d in dimensiones" :key="d.label" class="dim-chip">
              <span class="dim-label">{{ d.label }}</span>
              <span class="dim-value">{{ d.value }}</span>
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
              <p class="grupo-label">{{ tipo }}</p>
              <p class="grupo-desc">{{ materialDesc(tipo as string) }}</p>
              <div class="filamentos-grid">
                <button
                  v-for="pf in grupo"
                  :key="pf.filamento_id"
                  class="filamento-btn"
                  :class="{
                    active: selFilamentoId === pf.filamento_id,
                    'sin-stock': !pf.filamento.en_stock,
                  }"
                  :disabled="!pf.filamento.en_stock"
                  @click="selFilamentoId = pf.filamento_id"
                  :title="!pf.filamento.en_stock ? 'Sin stock' : pf.filamento.nombre"
                >
                  <span class="fil-swatch" :style="{ background: pf.filamento.hex_codigo }" />
                  <span class="fil-nombre">{{ pf.filamento.nombre }}</span>
                  <span v-if="!pf.filamento.en_stock" class="fil-badge">Agotado</span>
                </button>
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

        <a :href="ctaUrl" class="btn btn-primary cta-btn">Solicitar esta pieza</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.producto-page { min-height: 100vh; background: var(--bg); padding-bottom: 6rem; }
.back-bar { padding: 6.5rem 0 1.5rem; }
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
.tamano-input-wrap { display: flex; align-items: center; gap: 0.25rem; }
.tamano-input {
  width: 4.5rem; padding: 0.2rem 0.4rem; border-radius: 6px;
  border: 1.5px solid var(--border-soft); background: var(--bg-elevated);
  color: var(--cyan); font-size: 0.95rem; font-weight: 700;
  font-family: inherit; text-align: right; outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}
.tamano-input::-webkit-outer-spin-button,
.tamano-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.tamano-input:focus { border-color: var(--cyan); }
.tamano-unit { font-size: 0.85rem; font-weight: 600; color: var(--cyan); }
.dimensiones-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: -0.1rem; }
.dim-chip { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; padding: 0.3rem 0.75rem; border-radius: 8px; background: rgba(34,211,238,0.06); border: 1px solid rgba(34,211,238,0.15); }
.dim-label { font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
.dim-value { font-size: 0.82rem; font-weight: 700; color: var(--cyan); }

.size-slider { -webkit-appearance: none; width: 100%; height: 4px; background: var(--border); border-radius: 99px; outline: none; cursor: pointer; }
.size-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cyan); cursor: pointer; border: 2px solid var(--bg-card); box-shadow: 0 0 8px rgba(34,211,238,0.4); transition: transform 0.15s; }
.size-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
.slider-limits { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); }

/* Filamentos agrupados */
.filamentos-grupos { display: flex; flex-direction: column; gap: 1.25rem; }
.grupo-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.2rem; }
.grupo-desc { font-size: 0.8rem; color: var(--text-soft); line-height: 1.55; margin-bottom: 0.6rem; }
.filamentos-grid { display: flex; flex-direction: column; gap: 0.4rem; }

.filamento-btn {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 0.875rem; border-radius: var(--radius);
  border: 1.5px solid var(--border-soft);
  background: var(--bg-elevated); cursor: pointer;
  font-family: inherit; text-align: left;
  transition: border-color 0.2s, background 0.2s;
}
.filamento-btn:hover:not(:disabled) { border-color: var(--cyan); background: rgba(34,211,238,0.05); }
.filamento-btn.active { border-color: var(--cyan); background: rgba(34,211,238,0.08); }
.filamento-btn.sin-stock { opacity: 0.45; cursor: not-allowed; }

.fil-swatch { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.12); }
.fil-nombre { font-size: 0.85rem; font-weight: 600; color: var(--text); flex: 1; }
.fil-badge { font-size: 0.65rem; color: #f87171; background: rgba(248,113,113,0.12); padding: 0.15rem 0.5rem; border-radius: 99px; flex-shrink: 0; }

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

@media (max-width: 900px) {
  .producto-layout { grid-template-columns: 1fr; }
  .viewer-col { position: static; }
  .viewer-box { aspect-ratio: 4/3; }
  .skeleton-layout { grid-template-columns: 1fr; }
}
</style>
