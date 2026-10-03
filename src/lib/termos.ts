// Versão dos Termos de Uso em vigor.
//
// Guardamos, por usuário, qual versão ele aceitou, quando e de qual IP. Sem isso
// não há como provar o aceite nem saber a quem avisar quando o texto muda.
//
// Ao alterar os Termos: suba a data abaixo APENAS quando a mudança for relevante
// para quem já é cadastrado. Correção de vírgula não precisa de novo aceite; mudar
// regra de reembolso, de responsabilidade ou de foro, sim.

export const TERMOS_VERSAO = '2026-10-03'

/** Como a data aparece no cabeçalho da página de Termos */
export const TERMOS_DATA = '3 de outubro de 2026'

export interface AceiteDosTermos {
  termsVersion?: string | null
}

/** Precisa aceitar de novo? Conta nova sem registro também precisa. */
export function precisaAceitar(user: AceiteDosTermos | null | undefined): boolean {
  if (!user) return false
  return user.termsVersion !== TERMOS_VERSAO
}
