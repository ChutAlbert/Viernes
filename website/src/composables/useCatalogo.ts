import { ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Filamento {
  id: number
  nombre: string                 // "PLA Negro", "PETG Arcoíris"
  tipo_material: string          // "PLA" | "PLA+" | "PETG" (para aspecto visual 3D)
  hex_codigo: string             // "#000000"
  tarifa_por_minuto: number
  en_stock: boolean
  activo: boolean
}

export interface ProductoFilamentoOut {
  filamento_id: number
  archivo_3d_url: string | null  // archivo específico para este filamento
  filamento: Filamento
}

export interface ImagenProducto {
  id: number
  url: string
  orden: number
}

// Un contacto unificado: puede ser red social, dato de contacto, o ambos
export interface Contacto {
  id: number
  contact_type: string
  label: string
  value: string
  is_active: boolean
  areas: string
  es_red: boolean
  es_contacto: boolean
  orden: number
}

// Forma que consumen las vistas de redes (nombre/url/icono)
export interface RedSocial {
  id: number
  nombre: string
  url: string
  icono: string
  orden: number
  activo: boolean
}

export interface ProductoListItem {
  id: number
  slug: string | null
  nombre: string
  foto_preview_url: string | null
  tiempo_impresion_minutos: number
  tamano_minimo_mm: number
  tamano_maximo_mm: number
  permite_multicolor: boolean
  publicado: boolean
  precio_desde: number | null
  es_personalizable: boolean
}

export interface Producto extends ProductoListItem {
  descripcion: string | null
  archivo_3d_url: string | null
  tamano_base_mm: number
  tamano_y_mm: number | null
  tamano_z_mm: number | null
  max_colores: number
  activo: boolean
  es_personalizable: boolean
  filamentos: ProductoFilamentoOut[]
  imagenes: ImagenProducto[]
}

export interface PrecioDesglose {
  tiempo_base_minutos: number
  tamano_base_mm: number
  tamano_elegido_mm: number
  factor_tamano: number
  tiempo_ajustado_minutos: number
  filamento: string
  tipo_material: string
  tarifa_por_minuto: number
  precio_base: number
  multicolor: boolean
  num_colores: number
  multiplicador_multicolor: number
  precio_final: number
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export function archivoUrl(url: string | null): string | null {
  if (!url) return null
  const filename = url.split('/').pop()
  return filename ? `${API_BASE}/catalogo/public/archivo/${filename}` : null
}

export function imagenUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_BASE}${url}`
}

// ─── Composables ──────────────────────────────────────────────────────────────

export function useProductos() {
  const productos = ref<ProductoListItem[]>([])
  const loading = ref(true)
  const error = ref('')

  get<ProductoListItem[]>('/catalogo/public/productos')
    .then(data => { productos.value = data })
    .catch(e => { error.value = e.message })
    .finally(() => { loading.value = false })

  return { productos, loading, error }
}

// Filamentos globales: los colores son los mismos para todas las piezas.
// Se administran en Dashboard -> Filamentos (toggle "Mostrar en el sitio").
export function useFilamentos() {
  const filamentos = ref<Filamento[]>([])
  const loading = ref(true)

  get<Filamento[]>('/catalogo/public/filamentos')
    .then(data => { filamentos.value = data })
    .catch(() => { filamentos.value = [] })
    .finally(() => { loading.value = false })

  return { filamentos, loading }
}

export function useProducto(slug: string) {
  const producto = ref<Producto | null>(null)
  const loading = ref(true)
  const error = ref('')

  get<Producto>(`/catalogo/public/productos/${slug}`)
    .then(data => { producto.value = data })
    .catch(e => { error.value = e.message })
    .finally(() => { loading.value = false })

  return { producto, loading, error }
}

// Las redes ya viven en website_contacts marcadas con es_red
export function useRedes() {
  const redes = ref<RedSocial[]>([])
  get<Contacto[]>('/website/contacts')
    .then(data => {
      redes.value = data
        .filter(c => c.es_red)
        .map(c => ({
          id: c.id,
          nombre: c.label,
          url: hrefDe(c),
          icono: c.contact_type,
          orden: c.orden,
          activo: c.is_active,
        }))
    })
    .catch(() => {})
  return { redes }
}

export function hrefDe(c: { contact_type: string; value: string }): string {
  if (c.contact_type === 'email') return `mailto:${c.value}`
  if (c.contact_type === 'phone') return `tel:${c.value}`
  if (c.contact_type === 'whatsapp') return `https://wa.me/${c.value.replace(/\D/g, '')}`
  return c.value
}

export async function calcularPrecio(payload: {
  producto_id: number
  filamento_id: number
  tamano_mm: number
  multicolor: boolean
  num_colores: number
}): Promise<{ precio_final: number; desglose: PrecioDesglose }> {
  return post('/catalogo/public/calcular-precio', payload)
}
