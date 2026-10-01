// Link de conversa no WhatsApp a partir do telefone que a pessoa cadastrou.
//
// O número é guardado como ela digitou ("(62) 99999-8888", "62999998888", …),
// então aqui ele é normalizado antes de virar link.

/**
 * Telefone brasileiro em formato internacional, só dígitos — null quando não dá
 * para aproveitar.
 *
 * Atenção ao DDD 55 (Santa Maria/RS): um número com 10 ou 11 dígitos é sempre
 * DDD + assinante, mesmo começando com 55, e por isso o país entra pelo tamanho
 * e nunca pelo prefixo.
 */
export function telefoneInternacional(phone: string | null | undefined): string | null {
  const digitos = (phone || '').replace(/\D/g, '')

  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos

  return null
}

/** Link wa.me já com a mensagem pronta; null se o telefone não servir */
export function linkDoWhatsapp(phone: string | null | undefined, texto: string): string | null {
  const numero = telefoneInternacional(phone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

/** Primeira mensagem sugerida a quem clica no botão do anúncio */
export function recadoDoAnuncio(titulo: string, url: string) {
  return `Olá! Vi este anúncio na Immovi e tenho interesse:\n\n${titulo}\n${url}`
}
