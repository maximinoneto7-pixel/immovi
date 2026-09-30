import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { after } from 'next/server'
import { sendNewMessageEmail, sendPropertyInterestEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
import { touchPresence } from '@/lib/presence'
import { emailGateOpen, UNVERIFIED_MESSAGE_ERROR } from '@/lib/email-verification'
import { isOnline } from '@/lib/presence-labels'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  // Sem e-mail confirmado, ninguém conversa em nome de outra pessoa
  if (!(await emailGateOpen(session.user.id))) {
    return Response.json({ error: UNVERIFIED_MESSAGE_ERROR }, { status: 403 })
  }

  const body = await request.json()
  const { propertyId, receiverId, content } = body

  if (!receiverId || !content?.trim()) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  if (session.user.id === receiverId) {
    return Response.json({ error: 'Não pode enviar mensagem para si mesmo.' }, { status: 400 })
  }

  // Telefone e WhatsApp são liberados: quem anuncia paga pelo anúncio, não pela venda,
  // e prender a conversa aqui só atrapalha quem quer fechar negócio. O que protege as
  // partes é o aviso de nunca pagar antes de visitar e conferir a matrícula, não a mordaça.

  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: receiverId } } },
        propertyId ? { propertyId } : {},
      ],
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        propertyId: propertyId || null,
        participants: {
          create: [{ userId: session.user.id }, { userId: receiverId }],
        },
      },
    })
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })

  await touchPresence(session.user.id)

  // Avisos ao destinatário depois da resposta; after() garante que a Vercel espere
  // terminar (uma promise solta pode ser congelada antes de o e-mail sair)
  after(() => prisma.user.findUnique({
    where: { id: receiverId },
    select: { name: true, email: true, lastSeenAt: true },
  }).then(async receiver => {
    if (!receiver) return

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })
    if (!sender) return

    const property = propertyId
      ? await prisma.property.findUnique({ where: { id: propertyId }, select: { title: true, city: true, state: true, price: true, listingType: true } })
      : null

    const isFirstMessage = !await prisma.message.findFirst({
      where: { conversationId: conversation.id, senderId: session.user.id, id: { not: message.id } },
    })

    // Primeiro contato — e-mail especial de interesse
    if (isFirstMessage && property) {
      const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)
      await sendPropertyInterestEmail(
        receiver.email, receiver.name, sender.name,
        property.title, propertyId!, `${property.city}/${property.state}`, priceFormatted
      ).catch(console.error)
    } else {
      // Mensagem de continuação
      await sendNewMessageEmail(
        receiver.email, receiver.name, sender.name,
        content.trim(), property?.title || 'Imóvel', conversation.id
      ).catch(console.error)
    }

    // Notificação no celular/computador só para quem não está com o site aberto
    if (!isOnline(receiver.lastSeenAt)) {
      await sendPushToUser(receiverId, {
        title: `Nova mensagem de ${sender.name}`,
        body: content.trim().slice(0, 120),
        url: `/mensagens/${conversation.id}`,
      }).catch(console.error)
    }
  }).catch(console.error))

  return Response.json({ message, conversationId: conversation.id })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      property: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return Response.json({ conversations })
}
