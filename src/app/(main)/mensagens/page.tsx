import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listConversations } from '@/lib/chat'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ConversationList from '@/components/mensagens/ConversationList'
import { MessageCircle, Home } from 'lucide-react'

export default async function MensagensPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/mensagens')

  const conversations = await listConversations(session.user.id)

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
            <ConversationList conversations={conversations} currentUserId={session.user.id} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
