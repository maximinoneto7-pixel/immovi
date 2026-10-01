'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailGateOpen, UNVERIFIED_MESSAGE_ERROR } from '@/lib/email-verification'
import { registrar, origemDa } from '@/lib/registro'
import { sendTrialStartedEmail } from '@/lib/email'
import { TRIAL_DIAS, TRIAL_PLANO, TRIAL_VAGAS, motivoParaNaoResgatar } from '@/lib/trial'

/**
 * Ativa os 60 dias de Destaque da oferta de abertura.
 * Sem cartão: a pessoa clica, usa, e no fim decide se assina.
 */
export async function resgatarTeste() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Entre na sua conta para começar.' }
  const userId = session.user.id

  // E-mail confirmado é a trava contra alguém queimar as 50 vagas com contas falsas
  if (!(await emailGateOpen(userId))) return { error: UNVERIFIED_MESSAGE_ERROR }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, planId: true, planExpiresAt: true, trialEndsAt: true },
  })
  if (!user) return { error: 'Conta não encontrada.' }

  const impedimento = motivoParaNaoResgatar(user)
  if (impedimento) return { error: impedimento }

  const fim = new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000)

  // A contagem das vagas é refeita dentro da transação: sem isso, dois cliques ao
  // mesmo tempo na vaga 50 passariam os dois.
  try {
    await prisma.$transaction(async (tx) => {
      const usadas = await tx.user.count({ where: { trialEndsAt: { not: null } } })
      if (usadas >= TRIAL_VAGAS) throw new Error('ESGOTOU')

      const aindaLivre = await tx.user.findFirst({ where: { id: userId, trialEndsAt: null }, select: { id: true } })
      if (!aindaLivre) throw new Error('JA_USOU')

      await tx.user.update({
        where: { id: userId },
        data: { trialEndsAt: fim, planId: TRIAL_PLANO, planExpiresAt: fim, planWarnedAt: null },
      })

      // Entra no histórico como assinatura de teste: valor zero e sem id de pagamento,
      // então não entra na receita nem na contagem de assinantes pagantes.
      await tx.subscription.create({
        data: { plan: TRIAL_PLANO, status: 'TRIAL', amountPaid: 0, expiresAt: fim, userId },
      })
    })
  } catch (err) {
    const motivo = (err as Error).message
    if (motivo === 'ESGOTOU') return { error: 'As 50 vagas da oferta já acabaram.' }
    if (motivo === 'JA_USOU') return { error: 'Você já usou os 60 dias de teste.' }
    throw err
  }

  const origem = origemDa(await headers())
  after(async () => {
    await registrar('TESTE_GRATIS', {
      userId,
      email: user.email,
      ...origem,
      detail: `${TRIAL_PLANO} por ${TRIAL_DIAS} dias, até ${fim.toISOString().slice(0, 10)}`,
    })
    await sendTrialStartedEmail(user.email, user.name, fim)
  })

  revalidatePath('/planos')
  revalidatePath('/pagamentos')
  revalidatePath('/perfil')
  return { success: true, ate: fim.toISOString() }
}
