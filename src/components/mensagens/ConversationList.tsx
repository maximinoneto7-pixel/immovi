import Link from 'next/link'
import { Shield } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { ConversationSummary } from '@/lib/chat'
import { isOnline } from '@/lib/presence-labels'

interface ConversationListProps {
  conversations: ConversationSummary[]
  currentUserId: string
  /** Conversa aberta no momento (destacada na lateral) */
  activeId?: string
  /** cards: página /mensagens · pane: lateral da tela da conversa */
  variant?: 'cards' | 'pane'
}

export default function ConversationList({ conversations, currentUserId, activeId, variant = 'cards' }: ConversationListProps) {
  return (
    <div className={variant === 'cards' ? 'space-y-2' : 'divide-y divide-gray-100'}>
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.userId !== currentUserId)?.user
        const lastMsg = conv.messages[0]
        // Bolinha verde só se os dois mostram atividade (opção de privacidade do perfil)
        const online = conv.participants.every((p) => p.user.showActivity) && isOnline(other?.lastSeenAt)
        const hasUnread = lastMsg && lastMsg.receiverId === currentUserId && lastMsg.status === 'SENT'

        return (
          <Link
            key={conv.id}
            href={`/mensagens/${conv.id}`}
            className={cn(
              'flex items-center gap-3 transition-colors',
              variant === 'cards'
                ? 'gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow'
                : 'px-4 py-3 hover:bg-gray-50',
              conv.id === activeId && 'bg-indigo-50 hover:bg-indigo-50',
            )}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              {other?.image ? (
                <img src={other.image} alt={other.name} className={cn('rounded-full object-cover', variant === 'cards' ? 'w-12 h-12' : 'w-10 h-10')} />
              ) : (
                <div className={cn('rounded-full bg-indigo-100 flex items-center justify-center', variant === 'cards' ? 'w-12 h-12' : 'w-10 h-10')}>
                  <span className="text-indigo-700 font-semibold">{other?.name?.charAt(0)}</span>
                </div>
              )}
              {hasUnread && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white" />
              )}
              {online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" title="Online agora" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn('font-semibold text-sm truncate', hasUnread ? 'text-gray-900' : 'text-gray-700')}>
                    {other?.name}
                  </span>
                  {other?.verified && <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                </div>
                {lastMsg && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {variant === 'cards'
                      ? formatDate(lastMsg.createdAt)
                      : lastMsg.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })}
                  </span>
                )}
              </div>

              {conv.property && (
                <div className="text-xs text-indigo-600 mb-0.5 truncate">
                  {conv.property.title}
                </div>
              )}

              {lastMsg && (
                <p className={cn('text-xs truncate', hasUnread ? 'font-medium text-gray-900' : 'text-gray-500')}>
                  {lastMsg.senderId === currentUserId ? 'Você: ' : ''}{lastMsg.content}
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
