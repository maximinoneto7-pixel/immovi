import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getConversationFor, listConversations, markConversationRead } from '@/lib/chat'
import Header from '@/components/layout/Header'
import ConversationList from '@/components/mensagens/ConversationList'
import ChatThread from '@/components/mensagens/ChatThread'

export const metadata = { title: 'Mensagens — Immovi' }

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?redirect=/mensagens/${id}`)
  const userId = session.user.id

  const conversation = await getConversationFor(id, userId, session.user.role)
  if (!conversation) notFound()

  if (conversation.isParticipant) {
    await markConversationRead(id, userId)
    conversation.messages.forEach((m) => { if (m.receiverId === userId) m.status = 'READ' })
  }

  // Lista ao lado só para quem participa (é a lista de conversas dele)
  const conversations = conversation.isParticipant ? await listConversations(userId) : []

  // O admin acompanha pelo lado do dono do anúncio (ou do primeiro participante)
  const people = conversation.participants.map((p) => p.user)
  const viewerId = conversation.isParticipant
    ? userId
    : people.find((u) => u.id === conversation.property?.ownerId)?.id ?? people[0]?.id ?? userId
  const other = people.find((u) => u.id !== viewerId) ?? null

  const property = conversation.property && {
    id: conversation.property.id,
    title: conversation.property.title,
    price: conversation.property.price,
    rentPrice: conversation.property.rentPrice,
    listingType: conversation.property.listingType,
    status: conversation.property.status,
    coverUrl: conversation.property.images[0]?.url ?? null,
  }

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 sm:py-6">
          <div className="bg-white sm:rounded-2xl sm:border border-gray-100 sm:shadow-sm overflow-hidden grid lg:grid-cols-[320px_minmax(0,1fr)] h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-7rem)]">
            <aside className="hidden lg:flex flex-col min-h-0 border-r border-gray-100">
              <div className="px-4 py-3.5 border-b border-gray-100 font-bold text-gray-900">Mensagens</div>
              <div className="flex-1 overflow-y-auto">
                <ConversationList conversations={conversations} currentUserId={userId} activeId={id} variant="pane" />
              </div>
            </aside>
            <ChatThread
              conversationId={id}
              viewerId={viewerId}
              canSend={conversation.isParticipant}
              other={other}
              property={property}
              initialMessages={conversation.messages}
            />
          </div>
        </div>
      </main>
    </>
  )
}
