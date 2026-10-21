/**
 * Como cada perfil se chama na tela.
 *
 * No cartão do anúncio o vendedor aparece como "Proprietário": é assim que ele
 * se apresenta a quem procura imóvel, e foi o que a plataforma sempre mostrou.
 * Quando o papel não vier na consulta, cai aí também — o rótulo antigo.
 */
export function quemAnuncia(role?: string | null) {
  switch (role) {
    case 'AGENT': return 'Corretor'
    case 'ADMIN': return 'Immovi'
    case 'BUYER': return 'Anunciante'
    default: return 'Proprietário'
  }
}
