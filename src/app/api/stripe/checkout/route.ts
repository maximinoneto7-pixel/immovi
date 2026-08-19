import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PLANOS, type PlanoId } from '@/lib/stripe'
import { addMonths } from 'date-fns'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { planId } = await request.json() as { planId: PlanoId }
  const plan = PLANOS[planId]

  if (!plan || plan.preco === 0) {
    return Response.json({ error: 'Plano inválido.' }, { status: 400 })
  }

  // Sem Stripe configurado → simula assinatura para testes
  if (!stripe || !plan.stripePriceId) {
    const expiresAt = addMonths(new Date(), 1)
    await prisma.subscription.create({
      data: {
        plan: planId,
        status: 'ACTIVE',
        amountPaid: plan.preco / 100,
        expiresAt,
        userId: session.user.id,
      },
    })
    await prisma.user.update({
      where: { id: session.user.id },
      data: { planId, planExpiresAt: expiresAt },
    })
    return Response.json({ url: '/pagamentos?success=1' })
  }

  // Com Stripe configurado → cria checkout real
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, stripeCustomerId: true },
  })

  let customerId = user?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: user?.name,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.stripePriceId as string, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/pagamentos?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/planos?canceled=1`,
    locale: 'pt-BR',
    metadata: { userId: session.user.id, planId },
  })

  return Response.json({ url: checkoutSession.url })
}
