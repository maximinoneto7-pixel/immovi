import { auth } from '@/lib/auth'
import { countUnreadConversations } from '@/lib/chat'
import { touchPresence } from '@/lib/presence'
import { isEmailConfirmed } from '@/lib/email-verification'
import { prisma } from '@/lib/prisma'
import { precisaAceitar } from '@/lib/termos'

// Sinal de "online" enviado pelo cabeçalho a cada minuto com a aba aberta;
// devolve junto quantas conversas têm mensagem nova (aviso no ícone do chat)
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ unread: 0, emailConfirmed: true, termosPendentes: false })
  await touchPresence(session.user.id)
  const [unread, emailConfirmed, pessoa] = await Promise.all([
    countUnreadConversations(session.user.id),
    isEmailConfirmed(session.user.id),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { termsVersion: true } }),
  ])
  return Response.json({ unread, emailConfirmed, termosPendentes: precisaAceitar(pessoa) })
}
