import { ref, onMounted } from 'vue'
import type { Service, Contact, Member, SiteSettings } from '../types'

// Resolved at bundle time by the consuming app (Vite injects VITE_API_URL)
const API: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useServices() {
  const services = ref<Service[]>([])
  const loading = ref(true)

  onMounted(async () => {
    try {
      services.value = await fetchJson<Service[]>('/website/services')
    } catch {
      services.value = []
    } finally {
      loading.value = false
    }
  })

  return { services, loading }
}

export function useContacts() {
  const contacts = ref<Contact[]>([])
  const loading = ref(true)

  onMounted(async () => {
    try {
      contacts.value = await fetchJson<Contact[]>('/website/contacts')
    } catch {
      contacts.value = []
    } finally {
      loading.value = false
    }
  })

  return { contacts, loading }
}

export function useMembers() {
  const members = ref<Member[]>([])
  const loading = ref(true)

  onMounted(async () => {
    try {
      members.value = await fetchJson<Member[]>('/website/members')
    } catch {
      members.value = []
    } finally {
      loading.value = false
    }
  })

  return { members, loading }
}

export function useServiceBySlug(slug: string) {
  const service = ref<Service | null>(null)
  const loading = ref(true)
  const notFound = ref(false)

  onMounted(async () => {
    try {
      service.value = await fetchJson<Service>(`/website/services/${slug}`)
    } catch {
      notFound.value = true
    } finally {
      loading.value = false
    }
  })

  return { service, loading, notFound }
}

export interface Pieza {
  id: number
  nombre: string
  fotos?: string[] | null
  tipo: string
  filamento?: string | null
  fecha_entrega?: string | null
  notas?: string | null
}

export function usePiezasSincronizadas() {
  const piezas = ref<Pieza[]>([])
  const loading = ref(true)

  onMounted(async () => {
    try {
      piezas.value = await fetchJson<Pieza[]>('/piezas/public/sincronizadas')
    } catch {
      piezas.value = []
    } finally {
      loading.value = false
    }
  })

  return { piezas, loading }
}

export function useSiteSettings() {
  const settings = ref<SiteSettings>({
    hero_title: 'Soluciones Digitales a tu Medida',
    hero_subtitle: 'Desarrollo de Software · Impresión 3D · Diseño',
    hero_description: 'Transformamos tus ideas en productos reales.',
    company_name: 'SODIGIC',
    company_tagline: 'Construimos el futuro, hoy.',
  })
  const loading = ref(true)

  onMounted(async () => {
    try {
      const list = await fetchJson<{ key: string; value: string }[]>('/website/settings')
      list.forEach(({ key, value }) => {
        settings.value[key] = value
      })
    } catch {
      // use defaults
    } finally {
      loading.value = false
    }
  })

  return { settings, loading }
}
