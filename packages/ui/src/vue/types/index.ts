export interface Service {
  id: number
  title: string
  slug: string | null
  description: string
  long_description: string | null
  image_urls: string[] | null
  icon: string
  category: string
  order_index: number
  is_active: boolean
}

export interface Contact {
  id: number
  contact_type: ContactType
  label: string
  value: string
  is_active: boolean
  areas: string
  es_red: boolean
  es_contacto: boolean
  orden: number
}

export type ContactType =
  | 'phone' | 'email' | 'whatsapp' | 'other'
  | 'instagram' | 'facebook' | 'tiktok' | 'x'
  | 'youtube' | 'linkedin' | 'telegram'

export interface Member {
  id: number
  name: string
  role: string
  bio: string | null
  avatar_url: string | null
  github_url: string | null
  linkedin_url: string | null
  order_index: number
  is_active: boolean
}

export interface SiteSettings {
  hero_title: string
  hero_subtitle: string
  hero_description: string
  company_name: string
  company_tagline: string
  [key: string]: string
}
