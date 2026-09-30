import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailGateOpen, UNVERIFIED_MESSAGE_ERROR } from '@/lib/email-verification'
import { PERIODOS, listaDe, soData, nomeDoPeriodo, dataPorExtenso } from '@/lib/visitas'
import { sendVisitRequestEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
import { after } from 'next/server'

// Pedido de visita. Quem confirma é sempre o anunciante.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  if (!(await emailGateOpen(session.user.id))) {
    return Response.json({ error: UNVERIFIED_MESSAGE_ERROR }, { status: 403 })
  }

  const { propertyId, date, period, message } = await request.json()

  if (!propertyId || !date || !PERIODOS[period as keyof typeof PERIODOS]) {
    return Response.json({ error: 'Escolha o dia e o período da visita.' }, { status: 400 })
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, title: true, status: true, ownerId: true, city: true, state: true,
      owner: { select: { id: true, name: true, email: true } },
      visitAvailability: true,
    },
  })
  if (!property) return Response.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
  if (property.status !== 'ACTIVE') return Response.json({ error: 'Este anúncio não está disponível.' }, { status: 400 })
  if (property.ownerId === session.user.id) {
    return Response.json({ error: 'Você não agenda visita no seu próprio anúncio.' }, { status: 400 })
  }

  const agenda = property.visitAvailability
  if (!agenda) return Response.json({ error: 'Este anúncio ainda não tem horários de visita.' }, { status: 400 })

  const dia = soData(new Date(date))
  const minimo = soData(new Date(Date.now() + agenda.minDays * 24 * 60 * 60 * 1000))

  if (Number.isNaN(dia.getTime()) || dia < minimo) {
    return Response.json({ error: `O anunciante pede pelo menos ${agenda.minDays} dia(s) de antecedência.` }, { status: 400 })
  }
  if (!listaDe(agenda.weekdays).map(Number).includes(dia.getUTCDay())) {
    return Response.json({ error: 'O anunciante não recebe visitas nesse dia da semana.' }, { status: 400 })
  }
  if (!listaDe(agenda.periods).includes(period)) {
    return Response.json({ error: 'O anunciante não recebe visitas nesse período.' }, { status: 400 })
  }

  // Um pedido em aberto por imóvel e por pessoa
  const jaTem = await prisma.visit.findFirst({
    where: { propertyId, visitorId: session.user.id, status: { in: ['PENDING', 'CONFIRMED'] } },
  })
  if (jaTem) {
    return Response.json({ error: 'Você já tem uma visita em aberto neste imóvel.' }, { status: 400 })
  }

  // A conversa do chat, se já existir, para o pedido aparecer junto do resto
  const conversa = await prisma.conversation.findFirst({
    where: {
      propertyId,
      participants: { every: { userId: { in: [session.user.id, property.ownerId] } } },
    },
    select: { id: true },
  })

  const visita = await prisma.visit.create({
    data: {
      propertyId,
      visitorId: session.user.id,
      ownerId: property.ownerId,
      date: dia,
      period,
      message: (message || '').toString().slice(0, 400) || null,
      conversationId: conversa?.id || null,
    },
  })

  after(async () => {
    const visitante = await prisma.user.findUnique({ where: { id: session.user!.id }, select: { name: true } })
    sendVisitRequestEmail(property.owner.email, property.owner.name, {
      visitante: visitante?.name || 'Alguém',
      imovel: property.title,
      quando: `${dataPorExtenso(dia)} · ${nomeDoPeriodo(period)}`,
      recado: visita.message,
    }).catch(console.error)

    sendPushToUser(property.ownerId, {
      title: 'Pedido de visita',
      body: `${visitante?.name || 'Alguém'} · ${dataPorExtenso(dia)}, ${PERIODOS[period as keyof typeof PERIODOS].label.toLowerCase()}`,
      url: '/perfil/visitas',
    }).catch(console.error)
  })

  return Response.json({ ok: true, visita })
}
