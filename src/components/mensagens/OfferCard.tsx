'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Loader2, FileText, Clock, Handshake } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

export interface ChatOffer {
  id: string
  amount: number
  conditions: string | null
  message: string | null
  status: string
  expiresAt: string | Date
  respondedAt?: string | Date | null
  createdAt: string | Date
  fromId: string
  toId: string
}

const SELO: Record<string, { texto: string; classe: string }> = {
  PENDING: { texto: 'aguardando resposta', classe: 'bg-amber-50 text-amber-800 border-amber-200' },
  ACCEPTED: { texto: 'aceita', classe: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { texto: 'recusada', classe: 'bg-red-50 text-red-700 border-red-200' },
  COUNTERED: { texto: 'respondida com contraproposta', classe: 'bg-gray-50 text-gray-600 border-gray-200' },
  EXPIRED: { texto: 'prazo vencido', classe: 'bg-gray-50 text-gray-600 border-gray-200' },
  CANCELED: { texto: 'cancelada', classe: 'bg-gray-50 text-gray-600 border-gray-200' },
}

/** Proposta dentro da conversa: valor, condições, prazo e as ações de cada lado */
export default function OfferCard({
  offer,
  viewerId,
  podeAgir,
}: {
  offer: ChatOffer
  viewerId: string
  podeAgir: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')

  const minha = offer.fromId === viewerId
  const aguardando = offer.status === 'PENDING' && new Date(offer.expiresAt) > new Date()
  const selo = SELO[offer.status] || SELO.PENDING

  const responder = (acao: 'ACEITAR' | 'RECUSAR' | 'CANCELAR') => {
    setErro('')
    startTransition(async () => {
      const res = await fetch(`/api/propostas/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Não consegui responder agora.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className={cn('max-w-[86%] w-fit', minha ? 'ml-auto' : 'mr-auto')}>
      <div className={cn(
        'rounded-2xl border-2 bg-white p-3.5 space-y-2',
        offer.status === 'ACCEPTED' ? 'border-green-200 bg-green-50/40' : 'border-indigo-200',
      )}>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
          <Handshake className="w-3.5 h-3.5" />
          {minha ? 'Sua proposta' : 'Proposta recebida'}
        </div>

        <div className="text-xl font-bold text-gray-900">{formatCurrency(offer.amount)}</div>

        {(offer.conditions || aguardando) && (
          <div className="text-xs text-gray-500">
            {offer.conditions}
            {offer.conditions && aguardando && ' · '}
            {aguardando && `vale até ${new Date(offer.expiresAt).toLocaleDateString('pt-BR')}`}
          </div>
        )}

        {offer.message && (
          <p className="text-sm text-gray-700 leading-relaxed">“{offer.message}”</p>
        )}

        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold', selo.classe)}>
          {offer.status === 'PENDING' && <Clock className="w-3 h-3" />}
          {selo.texto}
        </span>

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        {podeAgir && aguardando && !minha && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => responder('ACEITAR')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Aceitar
            </button>
            <button
              onClick={() => responder('RECUSAR')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" />
              Recusar
            </button>
          </div>
        )}

        {podeAgir && aguardando && minha && (
          <button
            onClick={() => responder('CANCELAR')}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            Cancelar proposta
          </button>
        )}

        {offer.status === 'ACCEPTED' && podeAgir && (
          <Link
            href={`/contratos/novo?proposta=${offer.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Gerar contrato preenchido
          </Link>
        )}

        <p className="text-[10px] text-gray-400 leading-relaxed">
          {offer.status === 'ACCEPTED'
            ? 'Aceitar registra o acordo entre vocês. O contrato é que formaliza — confira a matrícula antes de assinar.'
            : 'Sem compromisso até a assinatura do contrato.'}
        </p>
      </div>
    </div>
  )
}
