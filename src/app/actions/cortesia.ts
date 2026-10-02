'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLANOS, type PlanoId } from '@/lib/stripe'
import { sincronizarRanking } from '@/lib/ranking'
import { registrar, origemDa } from '@/lib/registro'
import { PRAZOS, type PrazoDeCortesia } from '@/lib/cortesia'

// Plano de cortesia: o administrador libera um plano pago para alguém sem cobrança.
// Serve para a fase de arrancada, em que atrair anunciante vale mais que a mensalidade.

/** Libera um plano pago, sem cobrança, por um prazo */
export async function liberarPlano(userId: string, planId: string, dias: number) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'Só o administrador pode liberar plano.' }

  const plano = PLANOS[planId as PlanoId]
  if (!plano || plano.preco === 0) return { error: 'Escolha um plano pago.' }
  if (!PRAZOS.includes(dias as PrazoDeCortesia)) return { error: 'Prazo inválido.' }

  const pessoa = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, planExpiresAt: true },
  })
  if (!pessoa) return { error: 'Usuário não encontrado.' }

  // Soma ao que ainda resta, em vez de jogar fora o período em curso
  const base = pessoa.planExpiresAt && pessoa.planExpiresAt > new Date() ? pessoa.planExpiresAt : new Date()
  const expiresAt = new Date(base.getTime() + dias * 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: userId },
    data: { planId, planExpiresAt: expiresAt, planCortesia: true, planWarnedAt: null },
  })

  // Entra no histórico com valor zero e sem id de pagamento: não conta como receita
  await prisma.subscription.create({
    data: {
      plan: planId,
      status: 'CORTESIA',
      amountPaid: 0,
      billingCycle: 'MONTHLY',
      expiresAt,
      userId,
    },
  })

  await sincronizarRanking(userId)

  await registrar('PLANO_CORTESIA', {
    userId: session.user.id,
    email: session.user.email,
    ...origemDa(await headers()),
    detail: `${planId} por ${dias} dias para ${pessoa.email}, até ${expiresAt.toISOString().slice(0, 10)}`,
  })

  revalidatePath('/admin/usuarios')
  return { success: true, ate: expiresAt.toISOString() }
}

/** Tira a cortesia antes da hora. Não mexe em plano que foi pago. */
export async function removerCortesia(userId: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'Só o administrador pode remover.' }

  const pessoa = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, planCortesia: true },
  })
  if (!pessoa) return { error: 'Usuário não encontrado.' }
  if (!pessoa.planCortesia) return { error: 'Esta pessoa não está com plano de cortesia.' }

  await prisma.user.update({
    where: { id: userId },
    data: { planId: null, planExpiresAt: null, planCortesia: false, planWarnedAt: null },
  })
  await prisma.subscription.updateMany({
    where: { userId, status: 'CORTESIA' },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
  await sincronizarRanking(userId)

  await registrar('PLANO_CORTESIA', {
    userId: session.user.id,
    email: session.user.email,
    ...origemDa(await headers()),
    detail: `cortesia removida de ${pessoa.email}`,
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}
