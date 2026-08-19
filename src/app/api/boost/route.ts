import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, FOGUETES } from '@/lib/stripe'
import { addDays } from 'date-fns'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { propertyId, boostType } = await request.json()
  const boost = FOGUETES[boostType as keyof typeof FOGUETES]

  if (!boost) return Response.json({ error: 'Tipo de foguete inválido.' }, { status: 400 })

  // Verificar que a propriedade pertence ao usuário
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: session.user.id },
  })
  if (!property) return Response.json({ error: 'Imóvel não encontrado.' }, { status: 404 })

  // Cancelar boosts ativos do mesmo imóvel
  await prisma.propertyBoost.updateMany({
    where: { propertyId, status: 'ACTIVE' },
    data: { status: 'CANCELED' },
  })

  // Sem Stripe → simula pagamento para testes
  if (!stripe) {
    const expiresAt = addDays(new Date(), boost.dias)
    await prisma.propertyBoost.create({
      data: {
        boostType,
        status: 'ACTIVE',
        amountPaid: boost.preco / 100,
        expiresAt,
        propertyId,
        userId: session.user.id,
      },
    })
    await prisma.property.update({
      where: { id: propertyId },
      data: { featured: true },
    })
    return Response.json({ success: true, message: 'Foguete ativado com sucesso!' })
  }

  // Com Stripe → cria payment intent
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: boost.preco,
    currency: 'brl',
    customer: user?.stripeCustomerId || undefined,
    metadata: { propertyId, boostType, userId: session.user.id },
  })

  return Response.json({ clientSecret: paymentIntent.client_secret })
}
