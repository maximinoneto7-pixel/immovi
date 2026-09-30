import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailGateOpen, UNVERIFIED_MESSAGE_ERROR } from '@/lib/email-verification'
import { PRAZO_PADRAO_DIAS, PRAZO_MAX_DIAS, propostaEmAberto, expirarPropostasVencidas } from '@/lib/propostas'
import { sendOfferEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
import { registrar, origemDa } from '@/lib/registro'
import { formatCurrency } from '@/lib/utils'
import { after } from 'next/server'

// Nova proposta (ou contraproposta) dentro de uma conversa.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  if (!(await emailGateOpen(session.user.id))) {
    return Response.json({ error: UNVERIFIED_MESSAGE_ERROR }, { status: 403 })
  }

  const { conversationId, amount, conditions, message, dias } = await request.json()

  const valor = Number(amount)
  if (!conversationId || !Number.isFinite(valor) || valor <= 0) {
    return Response.json({ error: 'Informe o valor da proposta.' }, { status: 400 })
  }

  const conversa = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { select: { userId: true } },
      property: { select: { id: true, title: true, status: true } },
    },
  })
  if (!conversa) return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 })

  const souParticipante = conversa.participants.some((p) => p.userId === session.user!.id)
  if (!souParticipante) return Response.json({ error: 'Você não participa desta conversa.' }, { status: 403 })

  const outro = conversa.participants.find((p) => p.userId !== session.user!.id)
  if (!outro) return Response.json({ error: 'Conversa sem a outra pessoa.' }, { status: 400 })

  if (conversa.property && conversa.property.status !== 'ACTIVE') {
    return Response.json({ error: 'Este anúncio não está mais disponível para proposta.' }, { status: 400 })
  }

  await expirarPropostasVencidas(conversationId)

  // Contrapor encerra a proposta que estava de pé; propor duas vezes seguidas, não
  const emAberto = await propostaEmAberto(conversationId)
  if (emAberto) {
    if (emAberto.fromId === session.user.id) {
      return Response.json({ error: 'Sua proposta anterior ainda aguarda resposta. Cancele antes de enviar outra.' }, { status: 400 })
    }
    await prisma.offer.update({ where: { id: emAberto.id }, data: { status: 'COUNTERED', respondedAt: new Date() } })
  }

  const prazo = Math.min(PRAZO_MAX_DIAS, Math.max(1, Number(dias) || PRAZO_PADRAO_DIAS))
  const expiresAt = new Date(Date.now() + prazo * 24 * 60 * 60 * 1000)

  const proposta = await prisma.offer.create({
    data: {
      conversationId,
      propertyId: conversa.property?.id || null,
      fromId: session.user.id,
      toId: outro.userId,
      amount: valor,
      conditions: (conditions || '').toString().slice(0, 60) || null,
      message: (message || '').toString().slice(0, 500) || null,
      expiresAt,
    },
  })

  after(async () => {
    const [de, para] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user!.id }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: outro.userId }, select: { name: true, email: true } }),
    ])
    if (para) {
      sendOfferEmail(para.email, para.name, {
        tipo: emAberto ? 'contraproposta' : 'proposta',
        de: de?.name || 'Alguém',
        valor,
        condicoes: proposta.conditions,
        recado: proposta.message,
        imovel: conversa.property?.title || 'seu anúncio',
        conversationId,
        prazo: expiresAt,
      }).catch(console.error)
    }
    sendPushToUser(outro.userId, {
      title: `${emAberto ? 'Contraproposta' : 'Proposta'} de ${formatCurrency(valor)}`,
      body: `${de?.name || 'Alguém'} · ${conversa.property?.title || 'seu anúncio'}`,
      url: `/mensagens/${conversationId}`,
    }).catch(console.error)
    registrar('PROPOSTA', { userId: session.user!.id, ...origemDa(request as any), detail: `proposta ${proposta.id} · ${valor} · ${conversa.property?.id || 'sem imóvel'}` })
  })

  return Response.json({ ok: true, proposta })
}
