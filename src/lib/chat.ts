import { prisma } from '@/lib/prisma'

/** Conversas do usuário, da mais recente para a mais antiga, com a última mensagem */
export function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true, verified: true, lastSeenAt: true, showActivity: true } } },
      },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      property: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export type ConversationSummary = Awaited<ReturnType<typeof listConversations>>[number]

/**
 * Conversa completa para quem participa dela. O admin também abre (para moderar),
 * mas não conta como participante: não envia nem marca mensagens como lidas.
 */
export async function getConversationFor(conversationId: string, userId: string, role?: string | null) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true, verified: true, lastSeenAt: true, showActivity: true } } },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, content: true, senderId: true, receiverId: true, status: true, readAt: true, createdAt: true },
      },
      property: {
        select: {
          id: true, title: true, price: true, rentPrice: true, listingType: true, status: true, ownerId: true,
          images: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
  })
  if (!conversation) return null

  const isParticipant = conversation.participants.some((p) => p.userId === userId)
  if (!isParticipant && role !== 'ADMIN') return null
  return { ...conversation, isParticipant }
}

/** Marca como lidas as mensagens que o usuário recebeu na conversa */
export function markConversationRead(conversationId: string, userId: string) {
  return prisma.message.updateMany({
    where: { conversationId, receiverId: userId, status: 'SENT' },
    data: { status: 'READ', readAt: new Date() },
  })
}

/** Quantas conversas têm mensagem ainda não lida pelo usuário */
export async function countUnreadConversations(userId: string) {
  const rows = await prisma.message.groupBy({
    by: ['conversationId'],
    where: { receiverId: userId, status: 'SENT' },
  })
  return rows.length
}

type ConversationWithPeople = NonNullable<Awaited<ReturnType<typeof getConversationFor>>>

/** Lado "meu" da conversa: o próprio usuário; para o admin, o dono do anúncio (ou o primeiro participante) */
export function viewerIdFor(conversation: ConversationWithPeople, userId: string) {
  if (conversation.isParticipant) return userId
  const people = conversation.participants.map((p) => p.user)
  return people.find((u) => u.id === conversation.property?.ownerId)?.id ?? people[0]?.id ?? userId
}

/**
 * O que quem está vendo pode saber da outra pessoa. Se qualquer um dos dois
 * desligou "mostrar atividade", some o "visto por último" e o "visualizada".
 */
export function chatViewFor(conversation: ConversationWithPeople, viewerId: string) {
  const people = conversation.participants.map((p) => p.user)
  const activityVisible = people.every((u) => u.showActivity)
  const other = people.find((u) => u.id !== viewerId) ?? null

  const messages = conversation.messages.map((m) => (
    m.senderId === viewerId && !activityVisible ? { ...m, status: 'SENT', readAt: null } : m
  ))

  return {
    activityVisible,
    otherLastSeenAt: activityVisible ? other?.lastSeenAt ?? null : null,
    messages,
  }
}
