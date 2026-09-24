'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, FileText, Loader2, AlertCircle } from 'lucide-react'

/** Botões de conferência da matrícula: abrir o arquivo, aprovar ou recusar com motivo */
export default function DocumentReview({
  documentId,
  fileUrl,
  ownerName,
}: {
  documentId: string
  fileUrl: string | null
  ownerName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [recusando, setRecusando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  const decidir = (aprovado: boolean) => {
    setErro('')
    startTransition(async () => {
      const res = await fetch(`/api/admin/documentos/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprovado, motivo: aprovado ? null : motivo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Não consegui salvar a decisão.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {erro && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Abrir documento
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-500 rounded-xl text-sm">
            <FileText className="w-4 h-4" />
            Arquivo não disponível
          </span>
        )}

        <button
          onClick={() => decidir(true)}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Confere com {ownerName.split(' ')[0]} — verificar
        </button>

        <button
          onClick={() => setRecusando((v) => !v)}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          <X className="w-4 h-4" />
          Não confere
        </button>
      </div>

      {recusando && (
        <div className="space-y-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Motivo que será enviado ao anunciante. Ex.: a matrícula está em nome de outra pessoa."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={() => decidir(false)}
            disabled={isPending || !motivo.trim()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Recusar e avisar por e-mail
          </button>
        </div>
      )}
    </div>
  )
}
