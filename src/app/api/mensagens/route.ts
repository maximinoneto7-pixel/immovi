import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNewMessageEmail, sendPropertyInterestEmail } from '@/lib/email'

// Padrões que indicam tentativa de compartilhar telefone fora da plataforma
const PHONE_PATTERNS = [
  /\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/,          // telefones BR
  /\+\s*55\s*\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/, // +55 ...
  /\d{10,11}/,                                     // sequência de dígitos
  /whatsapp\.com\/[\w+]/i,                          // link whatsapp
]

const CONTACT_REDIRECT_PATTERNS = [
  /me\s+(liga|chama|add|manda)\s+(mensagem|msg|zap|wpp|whats)/i,
  /meu\s+(n[uú]mero|tel\.?|fone|celular|contato|zap|wpp)/i,
  /passa\s+(o\s+)?(n[uú]mero|contato|tel\.?|zap|wpp|whats)/i,
  /continua(r|mos)?\s+(f(o|u)ra|pelo\s+zap|no\s+whats)/i,
  /combina\s+(fora|pelo\s+zap|pelo\s+whats)/i,
]

function detectPhoneViolation(text: string): string | null {
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) return 'phone'
  }
  for (const pattern of CONTACT_REDIRECT_PATTERNS) {
    if (pattern.test(text)) return 'redirect'
  }
  return null
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await request.json()
  const { propertyId, receiverId, content } = body

  if (!receiverId || !content?.trim()) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  if (session.user.id === receiverId) {
    return Response.json({ error: 'Não pode enviar mensagem para si mesmo.' }, { status: 400 })
  }

  // Verificação de segurança: bloquear telefones e redirecionamentos
  const violation = detectPhoneViolation(content.trim())
  if (violation === 'phone') {
    return Response.json({
      error: '🛡️ Por sua segurança, não é permitido compartilhar números de telefone no chat. Continue a negociação aqui na plataforma para proteção de ambas as partes.',
      blocked: true,
    }, { status: 400 })
  }
  if (violation === 'redirect') {
    return Response.json({
      error: '🛡️ Por sua segurança, pedidos para continuar a conversa fora da plataforma não são permitidos. O chat da Immovi garante proteção para comprador e vendedor.',
      blocked: true,
    }, { status: 400 })
  }

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

  // Notificação por e-mail ao destinatário (assíncrono — não bloqueia a resposta)
  prisma.user.findUnique({
    where: { id: receiverId },
    select: { name: true, email: true },
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
      sendPropertyInterestEmail(
        receiver.email, receiver.name, sender.name,
        property.title, propertyId!, `${property.city}/${property.state}`, priceFormatted
      ).catch(console.error)
    } else {
      // Mensagem de continuação
      sendNewMessageEmail(
        receiver.email, receiver.name, sender.name,
        content.trim(), property?.title || 'Imóvel', conversation.id
      ).catch(console.error)
    }
  }).catch(console.error)

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
