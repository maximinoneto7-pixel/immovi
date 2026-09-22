/** Endereço público do site, usado onde o link precisa ser absoluto (e-mails, prévias de compartilhamento) */
export const SITE_URL = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/+$/, '')

/** Deixa absoluta uma URL que pode vir relativa (fotos locais) ou já completa (Vercel Blob) */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
