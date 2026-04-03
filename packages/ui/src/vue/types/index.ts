export interface Service {
  id: number
  title: string
  description: string
  icon: string
  category: string
  order_index: number
  is_active: boolean
}

export interface Contact {
  id: number
  contact_type: 'phone' | 'email' | 'whatsapp' | 'other'
  label: string
  value: string
  is_active: boolean
}

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
