import { auth } from '@/lib/auth'
import { countUnreadConversations } from '@/lib/chat'
import { touchPresence } from '@/lib/presence'

// Sinal de "online" enviado pelo cabeçalho a cada minuto com a aba aberta;
// devolve junto quantas conversas têm mensagem nova (aviso no ícone do chat)
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ unread: 0 })
  await touchPresence(session.user.id)
  return Response.json({ unread: await countUnreadConversations(session.user.id) })
}
