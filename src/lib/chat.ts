import { prisma } from '@/lib/prisma'

/** Conversas do usuário, da mais recente para a mais antiga, com a última mensagem */
export function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true, verified: true } } },
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
        include: { user: { select: { id: true, name: true, image: true, verified: true } } },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, content: true, senderId: true, receiverId: true, status: true, createdAt: true },
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
    data: { status: 'READ' },
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
