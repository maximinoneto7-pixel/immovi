'use client'

import { useState, useTransition } from 'react'
import { Flag, Loader2, Check, X, AlertCircle } from 'lucide-react'

const MOTIVOS = [
  { id: 'DOCUMENTO_FALSO', label: 'Documento ou titularidade falsa' },
  { id: 'IMOVEL_INEXISTENTE', label: 'Imóvel não existe ou não está à venda' },
  { id: 'PAGAMENTO_FORA', label: 'Pediram pagamento fora da plataforma' },
  { id: 'ANUNCIO_ENGANOSO', label: 'Preço irreal ou anúncio enganoso' },
  { id: 'OUTRO', label: 'Outro motivo' },
]

/** Denúncia de anúncio — aberta a qualquer visitante, sem precisar de conta */
export default function ReportListing({ propertyId }: { propertyId: string }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [relato, setRelato] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const enviar = () => {
    setErro('')
    startTransition(async () => {
      const res = await fetch('/api/denuncias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, reason: motivo, details: relato }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Não consegui enviar agora. Tente de novo.')
        return
      }
      setEnviado(true)
    })
  }

  if (enviado) {
    return (
      <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Denúncia recebida. Nossa equipe analisa em até 24 horas e o anunciante não fica sabendo quem avisou.</span>
      </div>
    )
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Denunciar este anúncio
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">Denunciar este anúncio</h3>
        <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      <div className="space-y-1.5">
        {MOTIVOS.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="motivo"
              value={m.id}
              checked={motivo === m.id}
              onChange={() => setMotivo(m.id)}
              className="w-4 h-4 accent-indigo-600"
            />
            {m.label}
          </label>
        ))}
      </div>

      <textarea
        value={relato}
        onChange={(e) => setRelato(e.target.value)}
        rows={3}
        placeholder="Conte o que aconteceu. Ajuda muito saber o detalhe: o que foi pedido, qual documento, qual conta."
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={enviar}
          disabled={isPending || !motivo}
          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
          Enviar denúncia
        </button>
        <button
          onClick={() => setAberto(false)}
          className="px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Sua denúncia é anônima para o anunciante. Em caso de golpe, registre também boletim de ocorrência.
      </p>
    </div>
  )
}
