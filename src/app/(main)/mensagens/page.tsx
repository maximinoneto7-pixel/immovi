import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { MessageCircle, Home, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function MensagensPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/mensagens')

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, verified: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      property: {
        select: { id: true, title: true, images: { take: 1 } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
            <p className="text-gray-500 text-sm mt-1">
              {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nenhuma mensagem ainda</h3>
              <p className="text-gray-500 text-sm mb-6">
                Quando entrar em contato com um anunciante, suas conversas aparecerão aqui.
              </p>
              <Link href="/imoveis" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Home className="w-4 h-4" />
                Buscar imóveis
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const other = conv.participants.find((p) => p.userId !== session.user!.id)?.user
                const lastMsg = conv.messages[0]
                const hasUnread = lastMsg && lastMsg.receiverId === session.user!.id && lastMsg.status === 'SENT'

                return (
                  <Link
                    key={conv.id}
                    href={`/mensagens/${conv.id}`}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      {other?.image ? (
                        <img src={other.image} alt={other.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-700 font-semibold">{other?.name?.charAt(0)}</span>
                        </div>
                      )}
                      {hasUnread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-sm ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {other?.name}
                          </span>
                          {other?.verified && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                        </div>
                        {lastMsg && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(lastMsg.createdAt)}</span>
                        )}
                      </div>

                      {conv.property && (
                        <div className="text-xs text-indigo-600 mb-0.5 truncate">
                          {conv.property.title}
                        </div>
                      )}

                      {lastMsg && (
                        <p className={`text-xs truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {lastMsg.senderId === session.user!.id ? 'Você: ' : ''}{lastMsg.content}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
