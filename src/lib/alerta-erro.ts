import { prisma } from '@/lib/prisma'
import { sendErrorAlertEmail } from '@/lib/email'

// Aviso de erro: o site manda um e-mail para a administração quando alguma coisa
// quebra. Sem isso, um cliente tropeça num problema e ninguém fica sabendo.
//
// Dois cuidados: nunca deixar o aviso derrubar quem o chamou, e nunca virar enxurrada
// — o mesmo erro só avisa uma vez por hora, e são no máximo 10 avisos por hora.

const UMA_HORA = 60 * 60 * 1000
const TETO_POR_HORA = 10

const ultimoAviso = new Map<string, number>()
let janela = { inicio: Date.now(), enviados: 0 }

function podeAvisar(chave: string) {
  const agora = Date.now()

  if (agora - janela.inicio > UMA_HORA) janela = { inicio: agora, enviados: 0 }
  if (janela.enviados >= TETO_POR_HORA) return false

  const anterior = ultimoAviso.get(chave)
  if (anterior && agora - anterior < UMA_HORA) return false

  ultimoAviso.set(chave, agora)
  janela.enviados++
  return true
}

/** Para onde o aviso vai: o primeiro admin cadastrado */
async function destinatario() {
  if (process.env.ALERT_EMAIL) return process.env.ALERT_EMAIL
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', deletedAt: null },
    select: { email: true },
    orderBy: { createdAt: 'asc' },
  })
  return admin?.email || null
}

export async function avisarErro(onde: string, erro: unknown, detalhes?: Record<string, unknown>) {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  const pilha = erro instanceof Error ? erro.stack : undefined

  console.error(`[Erro] ${onde}:`, mensagem)

  try {
    if (!podeAvisar(`${onde}:${mensagem}`)) return
    const para = await destinatario()
    if (!para) return
    await sendErrorAlertEmail(para, onde, mensagem, pilha, detalhes)
  } catch (falha) {
    // Se nem o aviso funcionar, fica só no registro do servidor
    console.error('[Erro] não consegui avisar:', (falha as Error).message)
  }
}
