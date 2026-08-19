import { prisma } from '@/lib/prisma'
import { sendPaymentOverdueEmail } from '@/lib/email'
import { addDays, addMonths } from 'date-fns'

export const maxDuration = 60

// Eventos Asaas que queremos tratar
// Documentação: https://docs.asaas.com/reference/webhook

export async function POST(request: Request) {
  // Verificar token de autenticação do webhook (configurado no painel Asaas)
  const authToken = request.headers.get('asaas-webhook-token') ||
                    request.headers.get('access_token')

  if (process.env.ASAAS_WEBHOOK_TOKEN && authToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return Response.json({ error: 'Token inválido.' }, { status: 401 })
  }

  let event: any
  try {
    event = await request.json()
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { event: eventType, payment } = event

  console.log(`[Asaas Webhook] ${eventType}`, payment?.id)

  try {
    switch (eventType) {

      // ── Pagamento confirmado (PIX instantâneo ou cartão) ──────────────
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        if (!payment?.externalReference) break

        // Formato: userId:planId  OU  boost:propertyId:boostType:userId
        if (payment.externalReference.startsWith('boost:')) {
          await handleBoostPayment(payment)
        } else {
          await handleSubscriptionPayment(payment)
        }
        break
      }

      // ── Boleto compensado (pode demorar 2 dias úteis) ─────────────────
      case 'PAYMENT_BANK_SLIP_VIEWED':
        console.log(`Boleto visualizado: ${payment?.id}`)
        break

      // ── Pagamento vencido ─────────────────────────────────────────────
      case 'PAYMENT_OVERDUE': {
        const ref = payment?.externalReference
        if (!ref) break

        if (!ref.startsWith('boost:')) {
          const [userId, planId] = ref.split(':')
          if (userId) {
            await prisma.subscription.updateMany({
              where: { userId, status: 'ACTIVE' },
              data: { status: 'PENDING' },
            })
            console.log(`⚠️ Pagamento vencido — plano suspenso: ${userId}`)

            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true },
            })
            if (user) {
              sendPaymentOverdueEmail(user.email, user.name, planId || 'atual').catch(console.error)
            }
          }
        }
        break
      }

      // ── Assinatura cancelada ──────────────────────────────────────────
      case 'PAYMENT_DELETED':
      case 'SUBSCRIPTION_DELETED': {
        const subscriptionId = event.subscription?.id || payment?.subscription
        if (!subscriptionId) break

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        })
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'CANCELED', canceledAt: new Date() },
          })
          await prisma.user.update({
            where: { id: sub.userId },
            data: { planId: null, planExpiresAt: null },
          })
          console.log(`❌ Assinatura cancelada: ${sub.userId}`)
        }
        break
      }

      default:
        console.log(`[Asaas] Evento não tratado: ${eventType}`)
    }
  } catch (err) {
    console.error('[Asaas Webhook] Erro:', err)
    return Response.json({ error: 'Erro interno.' }, { status: 500 })
  }

  return Response.json({ received: true })
}

// ─── Handlers internos ────────────────────────────────────────────────────────

async function handleSubscriptionPayment(payment: any) {
  const [userId, planId] = (payment.externalReference as string).split(':')
  if (!userId || !planId) return

  const expiresAt = addMonths(new Date(), 1)

  await prisma.subscription.create({
    data: {
      plan: planId,
      status: 'ACTIVE',
      stripeSubscriptionId: payment.subscription || payment.id,
      stripeInvoiceId: payment.id,
      amountPaid: payment.value,
      expiresAt,
      userId,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { planId, planExpiresAt: expiresAt },
  })

  console.log(`✅ Plano ativado: ${planId} para ${userId}`)
}

async function handleBoostPayment(payment: any) {
  // formato: boost:propertyId:boostType:userId
  const [, propertyId, boostType, userId] = (payment.externalReference as string).split(':')
  if (!propertyId || !boostType || !userId) return

  const days = parseInt(boostType.replace('FOGUETE_', ''))
  const expiresAt = addDays(new Date(), days)

  // Atualiza o boost pendente ou cria um novo
  const existing = await prisma.propertyBoost.findFirst({
    where: {
      propertyId,
      userId,
      boostType,
      status: 'PENDING',
    },
  })

  if (existing) {
    await prisma.propertyBoost.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', expiresAt },
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

  await prisma.property.update({
    where: { id: propertyId },
    data: { featured: true },
  })

  console.log(`🚀 Foguete ativado: ${boostType} para imóvel ${propertyId}`)
}
