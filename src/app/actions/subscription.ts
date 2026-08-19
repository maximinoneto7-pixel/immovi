'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAsaasClient, isAsaasConfigured } from '@/lib/asaas'
import { revalidatePath } from 'next/cache'

export async function cancelSubscription() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) return { error: 'Nenhuma assinatura ativa encontrada.' }

  // stripeSubscriptionId é reutilizado para guardar o ID da assinatura no Asaas
  if (sub.stripeSubscriptionId && isAsaasConfigured()) {
    try {
      const asaas = getAsaasClient()
      await asaas.subscriptions.cancel(sub.stripeSubscriptionId)
    } catch (err: any) {
      const alreadyGone = /not found|não encontrad/i.test(err.message || '')
      if (!alreadyGone) return { error: err.message || 'Erro ao cancelar assinatura no Asaas.' }
    }
  }

  // Não zeramos planId/planExpiresAt: o acesso continua até o fim do período já pago,
  // só a renovação automática é interrompida.
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })

  revalidatePath('/pagamentos')
  return { success: true }
}
