import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendErrorAlertEmail } from '@/lib/email'

// Aviso de erro: o site guarda o que quebrou e manda um e-mail para a
// administração. Sem isso, um cliente tropeça num problema e ninguém fica
// sabendo — ou fica sabendo uma vez só, e o motivo se perde.
//
// O controle de repetição vivia na memória do processo. Na Vercel cada instância
// tem a sua, então o mesmo erro avisava várias vezes em instâncias diferentes e,
// pior, as repetições seguintes sumiam sem deixar rastro. Agora quem conta é o
// banco: a linha é a mesma, o contador sobe, e o e-mail sai no máximo uma vez
// por hora para cada erro.

const UMA_HORA = 60 * 60 * 1000

/** Agrupa repetições do mesmo problema sem depender do tamanho da mensagem */
function chaveDoErro(onde: string, mensagem: string) {
  return createHash('sha1').update(`${onde}::${mensagem}`).digest('hex')
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
    const chave = chaveDoErro(onde, mensagem)
    const agora = new Date()

    const registro = await prisma.erroRegistrado.upsert({
      where: { chave },
      create: {
        chave, onde, mensagem,
        pilha: pilha || null,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
      },
      update: {
        vezes: { increment: 1 },
        ultimaEm: agora,
        // A pilha mais recente costuma ser a mais útil para reproduzir
        pilha: pilha || undefined,
        detalhes: detalhes ? JSON.stringify(detalhes) : undefined,
        // Voltou a acontecer: deixa de estar resolvido
        resolvidoEm: null,
      },
      select: { id: true, vezes: true, avisadoEm: true },
    })

    // E-mail no máximo uma vez por hora para o mesmo erro, agora valendo para o
    // site inteiro e não para uma instância só
    const avisadoHaPouco = registro.avisadoEm && agora.getTime() - registro.avisadoEm.getTime() < UMA_HORA
    if (avisadoHaPouco) return

    const para = await destinatario()
    if (!para) return

    await sendErrorAlertEmail(para, onde, mensagem, pilha, {
      ...detalhes,
      'vezes até agora': registro.vezes,
      'ver todos': '/admin/erros',
    })
    await prisma.erroRegistrado.update({ where: { id: registro.id }, data: { avisadoEm: agora } })
  } catch (falha) {
    // Se nem o aviso funcionar, fica só no registro do servidor
    console.error('[Erro] não consegui avisar:', (falha as Error).message)
  }
}
