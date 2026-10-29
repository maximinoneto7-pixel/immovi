/**
 * Endereço público do site, usado onde o link precisa ser absoluto (e-mails,
 * prévias de compartilhamento, sitemap).
 *
 * O site mora no www: immovi.com.br responde 308 e manda para lá. Mas o endereço
 * que ele declarava como oficial vinha sem o www, então todo robô de busca e toda
 * prévia de WhatsApp passavam por um desvio a mais antes de chegar. Aqui o
 * endereço é normalizado para a forma que realmente atende.
 */
function enderecoOficial() {
  const bruto = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/+$/, '')
  return bruto.replace('://immovi.com.br', '://www.immovi.com.br')
}

export const SITE_URL = enderecoOficial()

/** Deixa absoluta uma URL que pode vir relativa (fotos locais) ou já completa (Vercel Blob) */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
