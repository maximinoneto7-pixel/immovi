import { prisma } from '@/lib/prisma'
import { addDays, addMonths } from 'date-fns'

// Ativação do que foi pago no Asaas. Usada pelo webhook e pela conferência que o
// site faz ao abrir Pagamentos e Planos — por isso cada função precisa poder rodar
// duas vezes para o mesmo pagamento sem duplicar nada.

type PagamentoAsaas = {
  id: string
  value: number
  subscription?: string | null
  externalReference?: string | null
}

/** Já processamos este pagamento? (o id da cobrança fica guardado na assinatura/foguete) */
async function planoJaAtivado(paymentId: string) {
  return !!(await prisma.subscription.findFirst({ where: { stripeInvoiceId: paymentId } }))
}

/** Plano pago: referência no formato "userId:planId" */
export async function ativarPlanoPago(payment: PagamentoAsaas): Promise<boolean> {
  const [userId, planId] = (payment.externalReference || '').split(':')
  if (!userId || !planId) return false
  if (await planoJaAtivado(payment.id)) return false

  const expiresAt = addMonths(new Date(), 1)
  const assinaturaAsaas = payment.subscription || payment.id

  // A cobrança nasce "pendente" no checkout; aqui ela vira ativa em vez de virar uma segunda linha
  const pendente = await prisma.subscription.findFirst({
    where: { userId, stripeSubscriptionId: assinaturaAsaas },
  })

  if (pendente) {
    await prisma.subscription.update({
      where: { id: pendente.id },
      data: { status: 'ACTIVE', plan: planId, stripeInvoiceId: payment.id, amountPaid: payment.value, expiresAt },
    })
  } else {
    await prisma.subscription.create({
      data: {
        plan: planId,
        status: 'ACTIVE',
        stripeSubscriptionId: assinaturaAsaas,
        stripeInvoiceId: payment.id,
        amountPaid: payment.value,
        expiresAt,
        userId,
      },
    })
  }

  await prisma.user.update({ where: { id: userId }, data: { planId, planExpiresAt: expiresAt } })
  console.log(`[Asaas] Plano ativado: ${planId} para ${userId}`)
  return true
}

/** Foguete pago: referência no formato "boost:propertyId:boostType:userId" */
export async function ativarFoguetePago(payment: PagamentoAsaas): Promise<boolean> {
  const [, propertyId, boostType, userId] = (payment.externalReference || '').split(':')
  if (!propertyId || !boostType || !userId) return false

  const jaAtivo = await prisma.propertyBoost.findFirst({
    where: { stripePaymentIntentId: payment.id, status: 'ACTIVE' },
  })
  if (jaAtivo) return false

  const days = parseInt(boostType.replace('FOGUETE_', ''))
  const expiresAt = addDays(new Date(), days)

  const pendente = await prisma.propertyBoost.findFirst({
    where: { propertyId, userId, boostType, status: 'PENDING' },
  })

  if (pendente) {
    await prisma.propertyBoost.update({
      where: { id: pendente.id },
      data: { status: 'ACTIVE', expiresAt, stripePaymentIntentId: payment.id },
    })
  } else {
    await prisma.propertyBoost.create({
      data: {
        boostType,
        status: 'ACTIVE',
        amountPaid: payment.value,
        expiresAt,
        propertyId,
        userId,
        stripePaymentIntentId: payment.id,
      },
    })
  }

  await prisma.property.update({ where: { id: propertyId }, data: { featured: true } })
  console.log(`[Asaas] Foguete ativado: ${boostType} no imóvel ${propertyId}`)
  return true
}

/** Encaminha o pagamento para o tipo certo de ativação */
export function ativarPagamento(payment: PagamentoAsaas) {
  return (payment.externalReference || '').startsWith('boost:')
    ? ativarFoguetePago(payment)
    : ativarPlanoPago(payment)
}
