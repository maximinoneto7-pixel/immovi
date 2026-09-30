'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Handshake, Loader2, X, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const CONDICOES = ['À vista', 'Financiado', 'Entrada + parcelas', 'Permuta', 'A combinar']

/** "Fazer proposta" na conversa: valor, condição, prazo e um recado */
export default function NewOffer({
  conversationId,
  temPropostaDoOutro,
  referencia,
}: {
  conversationId: string
  /** Quando a bola está com você, o botão vira "Contrapropor" */
  temPropostaDoOutro: boolean
  /** Preço do anúncio, só para orientar quem digita */
  referencia?: number | null
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [valor, setValor] = useState('')
  const [condicao, setCondicao] = useState(CONDICOES[0])
  const [dias, setDias] = useState('7')
  const [recado, setRecado] = useState('')
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const numero = Number(valor.replace(/\D/g, ''))

  const enviar = () => {
    setErro('')
    startTransition(async () => {
      const res = await fetch('/api/propostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, amount: numero, conditions: condicao, message: recado, dias: Number(dias) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data.error || 'Não consegui enviar a proposta.')
        return
      }
      setAberto(false)
      setValor('')
      setRecado('')
      router.refresh()
    })
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
      >
        <Handshake className="w-4 h-4" />
        {temPropostaDoOutro ? 'Contrapropor' : 'Fazer proposta'}
      </button>
    )
  }

  return (
    <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">
          {temPropostaDoOutro ? 'Fazer contraproposta' : 'Fazer proposta'}
        </h3>
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

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Valor da proposta</label>
        <input
          inputMode="numeric"
          value={valor}
          onChange={(e) => setValor(e.target.value.replace(/\D/g, ''))}
          placeholder="Ex: 1950000"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
          {numero > 0 && <span className="font-semibold text-gray-700">{formatCurrency(numero)}</span>}
          {referencia ? <span>anúncio: {formatCurrency(referencia)}</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Forma de pagamento</label>
          <select
            value={condicao}
            onChange={(e) => setCondicao(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CONDICOES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vale por</label>
          <select
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="3">3 dias</option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>
      </div>

      <textarea
        value={recado}
        onChange={(e) => setRecado(e.target.value)}
        rows={2}
        placeholder="Um recado junto da proposta (opcional)"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      <button
        onClick={enviar}
        disabled={isPending || !(numero > 0)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
        Enviar proposta
      </button>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        A proposta não obriga ninguém: o negócio só se formaliza no contrato assinado.
      </p>
    </div>
  )
}
