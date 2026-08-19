import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { addMonths } from 'date-fns'
import type { PLANOS } from '@/lib/stripe'

export const maxDuration = 60

// Stripe exige o body raw (não parseado) para verificar a assinatura
export async function POST(request: Request) {
  if (!stripe) {
    return Response.json({ error: 'Stripe não configurado.' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent> | null = null

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  // ─── Processar eventos do Stripe ────────────────────────────────────────────

  try {
    switch (event.type) {

      // Checkout concluído — assinatura nova
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const { userId, planId } = session.metadata || {}
        if (!userId || !planId) break

        const expiresAt = addMonths(new Date(), 1)

        await prisma.subscription.create({
          data: {
            plan: planId,
            status: 'ACTIVE',
            stripeSubscriptionId: session.subscription,
            stripeInvoiceId: session.invoice,
            stripePriceId: session.line_items?.data?.[0]?.price?.id,
            amountPaid: (session.amount_total || 0) / 100,
            expiresAt,
            userId,
          },
        })

        await prisma.user.update({
          where: { id: userId },
          data: {
            planId,
            planExpiresAt: expiresAt,
            stripeCustomerId: session.customer,
          },
        })

        console.log(`✅ Assinatura ativada: ${planId} para usuário ${userId}`)
        break
      }

      // Fatura paga — renova a assinatura
      case 'invoice.paid': {
        const invoice = event.data.object as any
        const customerId = invoice.customer as string

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user || !user.planId) break

        const expiresAt = addMonths(new Date(), 1)

        await prisma.subscription.create({
          data: {
            plan: user.planId,
            status: 'ACTIVE',
            stripeSubscriptionId: invoice.subscription,
            stripeInvoiceId: invoice.id,
            amountPaid: (invoice.amount_paid || 0) / 100,
            expiresAt,
            userId: user.id,
          },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: { planExpiresAt: expiresAt },
        })

        console.log(`✅ Renovação: ${user.planId} para ${user.email}`)
        break
      }

      // Pagamento falhou — notifica mas não cancela imediatamente
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const customerId = invoice.customer as string

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        // Atualiza a última assinatura para PENDING
        await prisma.subscription.updateMany({
          where: { userId: user.id, status: 'ACTIVE' },
          data: { status: 'PENDING' },
        })

        console.log(`⚠️ Pagamento falhou: ${user.email}`)
        break
      }

      // Assinatura cancelada
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const customerId = sub.customer as string

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        await prisma.subscription.updateMany({
          where: { userId: user.id, stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED', canceledAt: new Date() },
        })

        await prisma.user.update({
          where: { id: user.id },
          data: { planId: null, planExpiresAt: null },
        })

        console.log(`❌ Assinatura cancelada: ${user.email}`)
        break
      }

      // Assinatura atualizada (upgrade/downgrade)
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const customerId = sub.customer as string
        const newPriceId = sub.items?.data?.[0]?.price?.id

        if (!newPriceId) break

        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        // Descobre qual plano corresponde ao price ID via env vars
        const priceMap: Record<string, string> = {
          [process.env.STRIPE_PRICE_DESTAQUE || '']: 'DESTAQUE',
          [process.env.STRIPE_PRICE_PROFISSIONAL || '']: 'PROFISSIONAL',
          [process.env.STRIPE_PRICE_IMOBILIARIA || '']: 'IMOBILIARIA',
        }
        const newPlanId = priceMap[newPriceId]

        if (newPlanId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { planId: newPlanId },
          })
          console.log(`🔄 Plano alterado para ${newPlanId}: ${user.email}`)
        }
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }
  } catch (err) {
    console.error('Erro ao processar evento:', err)
    return Response.json({ error: 'Erro interno.' }, { status: 500 })
  }

  return Response.json({ received: true })
}
