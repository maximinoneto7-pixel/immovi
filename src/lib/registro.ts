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

/** Tira o IP e o navegador de uma requisição, sem quebrar quando não houver */
export function origemDa(request?: { headers: { get(nome: string): string | null } } | Headers | null) {
  const headers = request && 'headers' in request ? request.headers : (request as Headers | null)
  return {
    ip: headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: headers?.get('user-agent')?.slice(0, 200) || null,
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
