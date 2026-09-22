import { auth } from '@/lib/auth'
import { chatViewFor, getConversationFor, markConversationRead, viewerIdFor } from '@/lib/chat'
import { touchPresence } from '@/lib/presence'

// Mensagens de uma conversa (a tela da conversa consulta a cada poucos segundos)
export async function GET(_request: Request, ctx: RouteContext<'/api/mensagens/[id]'>) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }
  const userId = session.user.id

  const { id } = await ctx.params
  const conversation = await getConversationFor(id, userId, session.user.role)
  if (!conversation) {
    return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 })
  }

  if (conversation.isParticipant) {
    await touchPresence(userId)
    const { count } = await markConversationRead(id, userId)
    // O que acabou de ser marcado já sai como lido nesta resposta
    if (count > 0) {
      const now = new Date()
      conversation.messages.forEach((m) => {
        if (m.receiverId === userId && m.status === 'SENT') { m.status = 'READ'; m.readAt = now }
      })
    }
  }

  const view = chatViewFor(conversation, viewerIdFor(conversation, userId))
  return Response.json({
    messages: view.messages,
    otherLastSeenAt: view.otherLastSeenAt,
    activityVisible: view.activityVisible,
  })
}
