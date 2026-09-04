// Presentación de un contacto unificado (website_contacts).
// Vive aquí para que ContactSection y las pills del sitio usen lo mismo.

export const COLOR_POR_TIPO: Record<string, string> = {
  phone: 'var(--cyan)',
  email: 'var(--amber)',
  whatsapp: '#22c55e',
  instagram: '#e1306c',
  facebook: '#1877f2',
  tiktok: '#ff0050',
  x: 'var(--text)',
  youtube: '#ff0000',
  linkedin: '#0a66c2',
  telegram: '#229ed9',
  other: '#818cf8',
}

export function colorDe(tipo: string): string {
  return COLOR_POR_TIPO[tipo] ?? COLOR_POR_TIPO.other
}

export function hrefDe(c: { contact_type: string; value: string }): string {
  if (c.contact_type === 'email') return `mailto:${c.value}`
  if (c.contact_type === 'phone') return `tel:${c.value}`
  if (c.contact_type === 'whatsapp') return `https://wa.me/${c.value.replace(/\D/g, '')}`
  return c.value
}

// ponytail: asume que los ultimos 10 digitos son el numero local.
// Cierto para MX y la mayoria; si no cuadra, cae al +digitos tal cual.
function formatTel(digitos: string): string {
  if (digitos.length < 10) return digitos ? `+${digitos}` : ''
  const local = digitos.slice(-10)
  const lada = digitos.slice(0, -10)
  const n = `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  return lada ? `+${lada} ${n}` : n
}

function usuarioDe(url: string): string {
  const limpia = url.replace(/[?#].*$/, '').replace(/\/+$/, '')
  const ultimo = limpia.split('/').pop() ?? ''
  return ultimo ? `@${ultimo}` : limpia.replace(/^https?:\/\/(www\.)?/, '')
}

const CON_USUARIO = new Set(['instagram', 'facebook', 'tiktok', 'x', 'youtube', 'linkedin', 'telegram'])

/** Lo que se le muestra al visitante — nunca la URL cruda. */
export function textoDe(c: { contact_type: string; value: string }): string {
  if (c.contact_type === 'whatsapp' || c.contact_type === 'phone') {
    return formatTel(c.value.replace(/\D/g, ''))
  }
  if (c.contact_type === 'email') return c.value
  if (CON_USUARIO.has(c.contact_type)) return usuarioDe(c.value)
  return c.value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '')
}
