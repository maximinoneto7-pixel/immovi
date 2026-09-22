import { auth } from '@/lib/auth'
import { getConversationFor, markConversationRead } from '@/lib/chat'

// Mensagens de uma conversa (a tela da conversa consulta a cada poucos segundos)
export async function GET(_request: Request, ctx: RouteContext<'/api/mensagens/[id]'>) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { id } = await ctx.params
  const conversation = await getConversationFor(id, session.user.id, session.user.role)
  if (!conversation) {
    return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 })
  }

  if (conversation.isParticipant) {
    const { count } = await markConversationRead(id, session.user.id)
    // O que acabou de ser marcado já sai como lido nesta resposta
    if (count > 0) {
      conversation.messages.forEach((m) => {
        if (m.receiverId === session.user.id) m.status = 'READ'
      })
    }
  }

  return Response.json({ messages: conversation.messages })
}
