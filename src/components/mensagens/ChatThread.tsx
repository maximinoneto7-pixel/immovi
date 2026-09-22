'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Shield, AlertCircle, Loader2, Home, Check, CheckCheck } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { isOnline, lastSeenLabel, whenLabel } from '@/lib/presence-labels'

export interface ChatMessage {
  id: string
  content: string
  senderId: string
  receiverId: string
  status: string
  readAt?: string | Date | null
  createdAt: string | Date
}

interface ChatThreadProps {
  conversationId: string
  /** Lado "meu" da conversa (à direita). Para o admin, o dono do anúncio */
  viewerId: string
  /** Só participantes enviam; o admin apenas acompanha */
  canSend: boolean
  other: { id: string; name: string; image: string | null; verified: boolean } | null
  property: {
    id: string; title: string; price: number; rentPrice: number | null
    listingType: string; status: string; coverUrl: string | null
  } | null
  initialMessages: ChatMessage[]
  /** "Visto por último" da outra pessoa — null quando a privacidade de um dos dois esconde */
  initialOtherLastSeenAt: string | null
  activityVisible: boolean
}

const POLL_MS = 4000
const TZ = 'America/Sao_Paulo'

const dayKey = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: TZ })
const timeOf = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

function dayLabel(d: Date) {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86_400_000)
  if (dayKey(d) === dayKey(today)) return 'Hoje'
  if (dayKey(d) === dayKey(yesterday)) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: TZ })
}

const PROPERTY_STATUS_LABEL: Record<string, string> = {
  INACTIVE: 'Pausado', SOLD: 'Vendido', RENTED: 'Alugado', DELETED: 'Anúncio removido',
}

export default function ChatThread({
  conversationId, viewerId, canSend, other, property, initialMessages, initialOtherLastSeenAt, activityVisible: initialActivityVisible,
}: ChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [otherLastSeenAt, setOtherLastSeenAt] = useState(initialOtherLastSeenAt)
  const [activityVisible, setActivityVisible] = useState(initialActivityVisible)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Mensagens novas chegam sozinhas enquanto a aba estiver visível
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/mensagens/${conversationId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data: { messages: ChatMessage[]; otherLastSeenAt: string | null; activityVisible: boolean } = await res.json()
      setOtherLastSeenAt(data.otherLastSeenAt)
      setActivityVisible(data.activityVisible)
      setMessages((prev) => {
        const sig = (list: ChatMessage[]) => `${list.length}|${list.at(-1)?.id}|${list.filter((m) => m.status === 'READ').length}`
        return sig(prev) === sig(data.messages) ? prev : data.messages
      })
    } catch {}
  }, [conversationId])

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const send = async () => {
    const content = draft.trim()
    if (!content || sending || !other) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property?.id, receiverId: other.id, content }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Não foi possível enviar. Tente novamente.')
        return
      }
      setDraft('')
      setMessages((prev) => [...prev, data.message])
    } catch {
      setError('Sem conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSending(false)
    }
  }

  const lastMineId = [...messages].reverse().find((m) => m.senderId === viewerId)?.id

  // ✓ enviada · ✓✓ entregue (a pessoa entrou no site depois) · ✓✓ colorido visualizada
  const deliveryOf = (m: ChatMessage): DeliveryState => {
    if (!activityVisible) return 'sent'
    if (m.status === 'READ') return 'read'
    // Entregue se a pessoa entrou no site depois do envio — ou está com ele aberto agora
    if (otherLastSeenAt && (isOnline(otherLastSeenAt) || new Date(otherLastSeenAt) > new Date(m.createdAt))) return 'delivered'
    return 'sent'
  }
  const propertyStatus = property ? PROPERTY_STATUS_LABEL[property.status] : undefined
  const propertyPrice = property
    ? property.listingType === 'RENT'
      ? `${formatCurrency(property.rentPrice || property.price)}/mês`
      : formatCurrency(property.price)
    : ''

  const propertyCard = property && (
    <PropertyLink property={property} price={propertyPrice} statusLabel={propertyStatus} />
  )

  return (
    <section className="flex flex-col min-h-0 min-w-0 bg-gray-50">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <Link href="/mensagens" className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Voltar para as conversas">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {other?.image ? (
          <img src={other.image} alt={other.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 font-semibold">{other?.name?.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 truncate">{other?.name || 'Conversa'}</span>
            {other?.verified && <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
          </div>
          {activityVisible && otherLastSeenAt ? (
            <div className={cn('text-xs', isOnline(otherLastSeenAt) ? 'text-green-600 font-semibold' : 'text-gray-500')}>
              {isOnline(otherLastSeenAt) ? '● Online agora' : lastSeenLabel(otherLastSeenAt)}
            </div>
          ) : (
            <div className="text-xs text-green-600">Conversa protegida na plataforma</div>
          )}
        </div>
        <div className="hidden sm:block">{propertyCard}</div>
      </div>
      {property && <div className="sm:hidden px-4 py-2 bg-white border-b border-gray-100">{propertyCard}</div>}

      {/* Mensagens */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((m, i) => {
          const date = new Date(m.createdAt)
          const prev = messages[i - 1]
          const newDay = !prev || dayKey(new Date(prev.createdAt)) !== dayKey(date)
          const mine = m.senderId === viewerId
          return (
            <div key={m.id} className="space-y-2">
              {newDay && (
                <div className="flex justify-center pt-2">
                  <span className="text-[11px] text-gray-500 bg-gray-200/70 px-2.5 py-0.5 rounded-full">{dayLabel(date)}</span>
                </div>
              )}
              <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                  mine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md',
                )}>
                  {m.content}
                  <div className={cn('text-[10px] mt-1 flex items-center justify-end gap-1', mine ? 'text-indigo-200' : 'text-gray-400')}>
                    {timeOf(date)}
                    {mine && <DeliveryMark state={deliveryOf(m)} />}
                  </div>
                </div>
              </div>
              {mine && m.id === lastMineId && activityVisible && m.status === 'READ' && m.readAt && (
                <div className="text-[11px] text-gray-400 text-right -mt-1">Visualizada {whenLabel(m.readAt)}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Envio */}
      {canSend ? (
        <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); if (error) setError('') }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
              }}
              rows={1}
              placeholder="Escreva sua mensagem…"
              aria-label="Mensagem"
              className="flex-1 resize-none max-h-32 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [field-sizing:content]"
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Por segurança, números de telefone e pedidos para continuar fora da plataforma são bloqueados.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-3 text-xs text-amber-800">
          Você está vendo esta conversa como administrador.
        </div>
      )}
    </section>
  )
}

function PropertyLink({ property, price, statusLabel }: {
  property: NonNullable<ChatThreadProps['property']>
  price: string
  statusLabel?: string
}) {
  const content = (
    <>
      {property.coverUrl ? (
        <img src={property.coverUrl} alt="" className="w-12 h-9 rounded-md object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-9 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-indigo-400" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-900 truncate max-w-[220px]">{property.title}</div>
        <div className="text-xs text-indigo-600 font-semibold">
          {statusLabel ? <span className="text-gray-500">{statusLabel}</span> : <>{price} · Ver anúncio</>}
        </div>
      </div>
    </>
  )

  // Anúncio removido não tem mais página para abrir
  if (property.status === 'DELETED') {
    return <div className="flex items-center gap-2.5 p-1.5 pr-3 border border-gray-100 rounded-xl opacity-70">{content}</div>
  }
  return (
    <Link href={`/imoveis/${property.id}`} className="flex items-center gap-2.5 p-1.5 pr-3 border border-gray-100 rounded-xl hover:border-indigo-200 transition-colors">
      {content}
    </Link>
  )
}

type DeliveryState = 'sent' | 'delivered' | 'read'

const DELIVERY_LABEL: Record<DeliveryState, string> = {
  sent: 'Enviada', delivered: 'Entregue', read: 'Visualizada',
}

function DeliveryMark({ state }: { state: DeliveryState }) {
  const Icon = state === 'sent' ? Check : CheckCheck
  return (
    <span title={DELIVERY_LABEL[state]} aria-label={DELIVERY_LABEL[state]}>
      <Icon className={cn('w-3.5 h-3.5', state === 'read' ? 'text-cyan-300' : 'text-indigo-200')} />
    </span>
  )
}
