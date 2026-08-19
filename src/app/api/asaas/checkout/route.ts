import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getAsaasClient, isAsaasConfigured,
  ASAAS_PLANOS, ASAAS_FOGUETES,
  nextDueDate, asaasDate,
  type AsaasBillingType,
} from '@/lib/asaas'
import { addDays, addMonths } from 'date-fns'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  if (!isAsaasConfigured()) {
    return Response.json({ error: 'Asaas não configurado.' }, { status: 503 })
  }

  const body = await request.json()
  const { type, planId, boostType, propertyId, billingType = 'PIX' } = body as {
    type: 'plan' | 'boost'
    planId?: string
    boostType?: string
    propertyId?: string
    billingType?: AsaasBillingType
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, cpf: true, asaasCustomerId: true },
  })

  if (!user) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  // Asaas exige CPF/CNPJ do cliente para gerar cobrança (PIX, boleto ou cartão)
  if (!user.cpf) {
    return Response.json(
      { error: 'Complete seu CPF em "Meu Perfil" antes de assinar um plano.' },
      { status: 400 }
    )
  }

  const asaas = getAsaasClient()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'

  // O Asaas exige que a URL de callback seja de um domínio cadastrado na conta
  // ("Minha Conta → Informações"). Em localhost isso nunca está configurado,
  // então omitimos o callback e confiamos só no webhook para confirmar o pagamento.
  const isLocalHost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')

  try {
    // ─── 1. Garantir que o cliente Asaas existe ─────────────────────────────
    let customerId = (user as any).asaasCustomerId

    if (!customerId) {
      // Tenta encontrar pelo e-mail primeiro
      const existing = await asaas.customers.findByEmail(user.email)
      if (existing.data?.length > 0) {
        customerId = existing.data[0].id
      } else {
        // Cria novo cliente
        const customer = await asaas.customers.create({
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpf || undefined,
          mobilePhone: user.phone?.replace(/\D/g, '') || undefined,
          externalReference: user.id,
        })
        customerId = customer.id
      }

      // Salva o ID do cliente Asaas no usuário
      await prisma.user.update({
        where: { id: user.id },
        data: { asaasCustomerId: customerId } as any,
      })
    }

    // ─── 2. Plano (assinatura recorrente) ────────────────────────────────────
    if (type === 'plan' && planId) {
      const plano = ASAAS_PLANOS[planId]
      if (!plano) return Response.json({ error: 'Plano inválido.' }, { status: 400 })

      const subscription = await asaas.subscriptions.create({
        customer: customerId,
        billingType: billingType as AsaasBillingType,
        value: plano.value,
        nextDueDate: nextDueDate(),
        cycle: plano.cycle,
        description: plano.description,
        externalReference: `${user.id}:${planId}`,
        ...(isLocalHost ? {} : {
          callback: {
            successUrl: `${baseUrl}/pagamentos?success=1&provider=asaas`,
            autoRedirect: true,
          },
        }),
      })

      // Busca a cobrança gerada para obter o link de pagamento
      const payments = await asaas.subscriptions.listPayments(subscription.id)
      const firstPayment = payments.data?.[0]

      // Salva a assinatura pendente no banco
      const expiresAt = addMonths(new Date(), 1)
      await prisma.subscription.create({
        data: {
          plan: planId,
          status: 'PENDING',
          amountPaid: plano.value,
          expiresAt,
          userId: user.id,
          stripeSubscriptionId: subscription.id, // reutilizando campo para o ID Asaas
        },
      })

      // Retorna o link de pagamento para redirecionar o usuário
      return Response.json({
        success: true,
        provider: 'asaas',
        subscriptionId: subscription.id,
        paymentId: firstPayment?.id,
        invoiceUrl: firstPayment?.invoiceUrl,
        billingType,
        ...(billingType === 'PIX' && firstPayment
          ? await asaas.payments.getPixQrCode(firstPayment.id).catch(() => ({}))
          : {}),
      })
    }

    // ─── 3. Foguete (pagamento único) ────────────────────────────────────────
    if (type === 'boost' && boostType && propertyId) {
      const foguete = ASAAS_FOGUETES[boostType]
      if (!foguete) return Response.json({ error: 'Tipo de foguete inválido.' }, { status: 400 })

      const property = await prisma.property.findFirst({
        where: { id: propertyId, ownerId: user.id },
      })
      if (!property) return Response.json({ error: 'Imóvel não encontrado.' }, { status: 404 })

      const payment = await asaas.payments.create({
        customer: customerId,
        billingType: billingType as AsaasBillingType,
        value: foguete.value,
        dueDate: nextDueDate(),
        description: foguete.description,
        externalReference: `boost:${propertyId}:${boostType}:${user.id}`,
        ...(isLocalHost ? {} : {
          callback: {
            successUrl: `${baseUrl}/imoveis/${propertyId}?boost=success`,
            autoRedirect: true,
          },
        }),
      })

      const days = parseInt(boostType.replace('FOGUETE_', ''))

      // Salva o boost pendente
      await prisma.propertyBoost.create({
        data: {
          boostType,
          status: 'PENDING',
          amountPaid: foguete.value,
          expiresAt: addDays(new Date(), days),
          propertyId,
          userId: user.id,
          stripePaymentIntentId: payment.id, // reutilizando campo para o ID Asaas
        },
      })

      return Response.json({
        success: true,
        provider: 'asaas',
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        billingType,
        ...(billingType === 'PIX'
          ? await asaas.payments.getPixQrCode(payment.id).catch(() => ({}))
          : {}),
      })
    }

    return Response.json({ error: 'Tipo de pagamento inválido.' }, { status: 400 })

  } catch (err: any) {
    console.error('Erro Asaas checkout:', err.message)
    return Response.json({ error: err.message || 'Erro ao processar pagamento.' }, { status: 500 })
  }
}
