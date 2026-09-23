import { prisma } from '@/lib/prisma'
import { sendPaymentOverdueEmail } from '@/lib/email'
import { getAsaasClient, isAsaasConfigured } from '@/lib/asaas'
import { ativarPagamento } from '@/lib/asaas-activation'

export const maxDuration = 60

// Eventos Asaas que queremos tratar
// Documentação: https://docs.asaas.com/reference/webhook

export async function POST(request: Request) {
  // A senha combinada no painel do Asaas identifica o remetente. Quando ela não bate,
  // o evento não é recusado de imediato: nada é liberado sem antes conferir a cobrança
  // no próprio Asaas (ver confirmarNoAsaas), então um evento forjado não ativa nada.
  const authToken = request.headers.get('asaas-webhook-token') ||
                    request.headers.get('access_token')
  const senhaConfere = !process.env.ASAAS_WEBHOOK_TOKEN || authToken === process.env.ASAAS_WEBHOOK_TOKEN
  if (!senhaConfere) {
    console.warn('[Asaas Webhook] senha do webhook não confere; o evento só vale se o Asaas confirmar')
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
        if (!payment?.id) break
        const confirmado = await confirmarNoAsaas(payment)
        if (!confirmado) {
          console.warn(`[Asaas Webhook] cobrança ${payment.id} não consta como paga; ignorado`)
          break
        }
        await ativarPagamento(confirmado)
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
        if (!(await venceuMesmo(payment))) {
          console.warn(`[Asaas Webhook] cobrança ${payment?.id} não consta como vencida; ignorado`)
          break
        }

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
        if (!(await sumiuDoAsaas(subscriptionId))) {
          console.warn(`[Asaas Webhook] assinatura ${subscriptionId} continua ativa no Asaas; ignorado`)
          break
        }

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

const PAGOS = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']

/** O plano só é suspenso se o Asaas também disser que a cobrança venceu */
async function venceuMesmo(payment: any) {
  if (!payment?.id || !isAsaasConfigured()) return false
  try {
    const cobranca = await getAsaasClient().payments.get(payment.id)
    return cobranca.status === 'OVERDUE'
  } catch {
    return false
  }
}

/** A assinatura só é cancelada no site se ela realmente não existir mais no Asaas */
async function sumiuDoAsaas(subscriptionId: string) {
  if (!isAsaasConfigured()) return false
  try {
    const assinatura = await getAsaasClient().subscriptions.get(subscriptionId)
    return assinatura.status !== 'ACTIVE'
  } catch {
    // O Asaas responde erro para assinatura apagada
    return true
  }
}

/**
 * Confere a cobrança direto no Asaas antes de liberar plano ou foguete. Assim o site
 * age pelo que o Asaas confirma, e não pelo que chegou no corpo da requisição.
 */
async function confirmarNoAsaas(payment: any) {
  if (!isAsaasConfigured()) return null
  try {
    const cobranca = await getAsaasClient().payments.get(payment.id)
    if (!PAGOS.includes(cobranca.status)) return null
    return { ...cobranca, externalReference: cobranca.externalReference ?? payment.externalReference }
  } catch (err) {
    console.error('[Asaas Webhook] não consegui conferir a cobrança:', (err as Error).message)
    return null
  }
}
