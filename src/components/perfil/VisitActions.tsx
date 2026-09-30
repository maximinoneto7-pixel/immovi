'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'

/** Confirmar, recusar ou cancelar uma visita */
export default function VisitActions({
  visitId,
  status,
  souDono,
}: {
  visitId: string
  status: string
  souDono: boolean
}) {
  const router = useRouter()
  const [nota, setNota] = useState('')
  const [pedindoNota, setPedindoNota] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const responder = (acao: 'CONFIRMAR' | 'RECUSAR' | 'CANCELAR') => {
    setErro('')
    startTransition(async () => {
      const res = await fetch(`/api/visitas/${visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, nota }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(data.error || 'Não consegui responder.'); return }
      setPedindoNota(null)
      setNota('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {erro && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      {pedindoNota && (
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          placeholder={pedindoNota === 'RECUSAR' ? 'Motivo da recusa (vai para a outra pessoa)' : 'Por que está cancelando'}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      )}

      <div className="flex flex-wrap gap-2">
        {souDono && status === 'PENDING' && (
          <>
            <button
              onClick={() => responder('CONFIRMAR')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar visita
            </button>
            <button
              onClick={() => (pedindoNota === 'RECUSAR' ? responder('RECUSAR') : setPedindoNota('RECUSAR'))}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <X className="w-4 h-4" />
              {pedindoNota === 'RECUSAR' ? 'Enviar recusa' : 'Recusar'}
            </button>
          </>
        )}

        <button
          onClick={() => (pedindoNota === 'CANCELAR' ? responder('CANCELAR') : setPedindoNota('CANCELAR'))}
          disabled={isPending}
          className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {pedindoNota === 'CANCELAR' ? 'Confirmar cancelamento' : 'Cancelar visita'}
        </button>
      </div>
    </div>
  )
}
