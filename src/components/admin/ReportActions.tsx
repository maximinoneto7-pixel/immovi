'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Trash2, UserX, Archive } from 'lucide-react'

/** Decisão sobre a denúncia: tirar do ar, suspender a conta ou arquivar — sempre com motivo */
export default function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [acao, setAcao] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const decidir = () => {
    setErro('')
    startTransition(async () => {
      const res = await fetch(`/api/admin/denuncias/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, nota }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Não consegui salvar a decisão.')
        return
      }
      router.refresh()
    })
  }

  const botoes = [
    { id: 'REMOVER_ANUNCIO', label: 'Tirar o anúncio do ar', icon: Trash2, cor: 'bg-red-600 text-white hover:bg-red-700' },
    { id: 'SUSPENDER_CONTA', label: 'Suspender a conta', icon: UserX, cor: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' },
    { id: 'ARQUIVAR', label: 'Arquivar sem ação', icon: Archive, cor: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' },
  ]

  return (
    <div className="space-y-3">
      {erro && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {botoes.map((b) => (
          <button
            key={b.id}
            onClick={() => setAcao(acao === b.id ? null : b.id)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              acao === b.id ? 'ring-2 ring-offset-1 ring-indigo-400 ' + b.cor : b.cor
            }`}
          >
            <b.icon className="w-4 h-4" />
            {b.label}
          </button>
        ))}
      </div>

      {acao && (
        <div className="space-y-2">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            placeholder={
              acao === 'ARQUIVAR'
                ? 'Por que a denúncia não procede. Fica só no registro.'
                : 'Motivo da remoção. Vai no e-mail ao anunciante e fica no registro.'
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={decidir}
            disabled={isPending || !nota.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirmar decisão
          </button>
        </div>
      )}
    </div>
  )
}
