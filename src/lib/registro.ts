import { prisma } from '@/lib/prisma'

// Registro de acesso e de publicação: quem fez, de onde e quando.
//
// Serve para duas coisas: responder a uma ordem judicial numa fraude sem depender
// de memória, e cumprir o art. 15 do Marco Civil da Internet, que manda guardar
// registro de acesso por 6 meses. A manutenção diária apaga o que passa do prazo.

export const RETENCAO_DIAS = 180

export type TipoRegistro =
  | 'LOGIN'
  | 'LOGIN_FALHA'
  | 'ANUNCIO_CRIADO'
  | 'ANUNCIO_EDITADO'
  | 'DOCUMENTO_ENVIADO'
  | 'DOCUMENTO_CONFERIDO'
  | 'DENUNCIA'
  | 'PROPOSTA'
  | 'TESTE_GRATIS'

/**
 * Tira o IP e o navegador de uma requisição.
 *
 * Aceita tanto um Request (rotas de API) quanto o próprio Headers devolvido por
 * headers() (server actions). A diferença é descoberta por quem sabe responder
 * get(): checar a existência da propriedade "headers" dava falso positivo no
 * Headers do Next e quebrava a chamada com "headers?.get is not a function".
 */
export function origemDa(
  entrada?: { headers: { get(nome: string): string | null } } | { get(nome: string): string | null } | null
) {
  const cabecalhos =
    entrada && typeof (entrada as { get?: unknown }).get === 'function'
      ? (entrada as { get(nome: string): string | null })
      : (entrada as { headers?: { get(nome: string): string | null } } | null)?.headers

  return {
    ip: cabecalhos?.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: cabecalhos?.get('user-agent')?.slice(0, 200) || null,
  }
}

/** Nunca lança: um registro que falha não pode derrubar a ação que o gerou */
export async function registrar(
  type: TipoRegistro,
  dados: { userId?: string | null; email?: string | null; ip?: string | null; userAgent?: string | null; detail?: string | null }
) {
  try {
    await prisma.accessLog.create({
      data: {
        type,
        userId: dados.userId || null,
        email: dados.email || null,
        ip: dados.ip || null,
        userAgent: dados.userAgent || null,
        detail: dados.detail?.slice(0, 500) || null,
      },
    })
  } catch (err) {
    console.error('[Registro] não consegui gravar:', (err as Error).message)
  }
}
