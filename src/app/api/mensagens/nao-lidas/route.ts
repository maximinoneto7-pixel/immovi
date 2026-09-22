import { auth } from '@/lib/auth'
import { countUnreadConversations } from '@/lib/chat'

// Aviso de mensagem nova no ícone do chat no cabeçalho
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ count: 0 })
  return Response.json({ count: await countUnreadConversations(session.user.id) })
}
