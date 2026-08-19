import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { MessageCircle, ArrowLeft, AlertTriangle, Shield, Home, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Regex para detectar tentativas de compartilhar telefone
const PHONE_REGEX = /(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})/g
const PHONE_PATTERNS = [
  /\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/,
  /\d{11}/,
  /whatsapp/i,
  /zap\s*zap/i,
  /meu\s*(n[uú]mero|tel|fone|contato)/i,
  /me\s*(liga|chama|add)/i,
]

function hasPhoneAttempt(text: string): boolean {
  return PHONE_PATTERNS.some((r) => r.test(text))
}

export default async function AdminConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; alert?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const showAlerts = params.alert === 'true'
  const page = parseInt(params.page || '1')
  const pageSize = 15
  const skip = (page - 1) * pageSize

  const conversations = await prisma.conversation.findMany({
    skip,
    take: pageSize,
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          sender: { select: { name: true } },
        },
      },
      property: { select: { id: true, title: true } },
    },
  })

  const total = await prisma.conversation.count()

  // Detectar conversas com tentativas de compartilhar telefone
  const flagged = conversations.filter((conv) =>
    conv.messages.some((m) => hasPhoneAttempt(m.content))
  )

  const displayConversations = showAlerts ? flagged : conversations

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Monitoramento de Conversas</h1>
                <p className="text-sm text-gray-500">{total} conversas • {flagged.length} alertas detectados</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/conversas"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  !showAlerts ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todas ({total})
              </Link>
              <Link
                href="/admin/conversas?alert=true"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  showAlerts ? 'bg-red-600 text-white' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Alertas ({flagged.length})
              </Link>
            </div>
          </div>

          {/* Aviso sobre política */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900 text-sm">Política de proteção da plataforma</div>
              <p className="text-xs text-amber-700 mt-1">
                O sistema detecta automaticamente tentativas de compartilhamento de telefone, WhatsApp ou redirecionamento de negócios para fora da plataforma.
                Conversas marcadas com ⚠️ contêm padrões suspeitos e devem ser revisadas.
              </p>
            </div>
          </div>

          {/* Lista de conversas */}
          <div className="space-y-3">
            {displayConversations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {showAlerts ? 'Nenhum alerta detectado' : 'Nenhuma conversa encontrada'}
                </p>
              </div>
            ) : (
              displayConversations.map((conv) => {
                const isFlagged = conv.messages.some((m) => hasPhoneAttempt(m.content))
                const [p1, p2] = conv.participants

                return (
                  <div key={conv.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                    isFlagged ? 'border-red-200' : 'border-gray-100'
                  }`}>
                    <div className={`flex items-center justify-between px-5 py-3 border-b ${
                      isFlagged ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        {isFlagged && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            ALERTA: Possível vazamento de contato
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">{p1?.user.name}</span>
                          <span className="text-gray-400">↔</span>
                          <span className="font-semibold text-gray-900">{p2?.user.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {conv.property && (
                          <Link href={`/imoveis/${conv.property.id}`}
                            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">
                            <Home className="w-3 h-3" />
                            {conv.property.title.slice(0, 30)}...
                          </Link>
                        )}
                        <span>{formatDate(conv.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Últimas mensagens */}
                    <div className="divide-y divide-gray-50">
                      {[...conv.messages].reverse().map((msg) => {
                        const suspicious = hasPhoneAttempt(msg.content)
                        return (
                          <div key={msg.id} className={`px-5 py-3 ${suspicious ? 'bg-red-50' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-700">{msg.sender.name}</span>
                              <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                              {suspicious && (
                                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  Possível telefone
                                </span>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${suspicious ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                              {msg.content}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Paginação */}
          {total > pageSize && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <Link href={`/admin/conversas?page=${page - 1}${showAlerts ? '&alert=true' : ''}`}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                  Anterior
                </Link>
              )}
              {page * pageSize < total && (
                <Link href={`/admin/conversas?page=${page + 1}${showAlerts ? '&alert=true' : ''}`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  Próximo
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
