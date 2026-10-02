'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2, X, AlertCircle, Check } from 'lucide-react'
import { liberarPlano, removerCortesia } from '@/app/actions/cortesia'
import { PRAZOS } from '@/lib/cortesia'
import { PLANOS } from '@/lib/stripe'

const PAGOS = Object.values(PLANOS).filter((p) => p.preco > 0)

/** Libera um plano pago para alguém, sem cobrança */
export default function PlanoCortesia({
  userId,
  nome,
  planoAtual,
  valeAte,
  cortesia,
}: {
  userId: string
  nome: string
  planoAtual: string | null
  /** ISO; null quando não há plano em vigor */
  valeAte: string | null
  cortesia: boolean
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [plano, setPlano] = useState<string>(PAGOS[0].id)
  const [dias, setDias] = useState<number>(90)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const emVigor = valeAte && new Date(valeAte) > new Date()
  const data = valeAte ? new Date(valeAte).toLocaleDateString('pt-BR') : null

  const liberar = () => {
    setErro('')
    startTransition(async () => {
      const r = await liberarPlano(userId, plano, dias)
      if (r?.error) { setErro(r.error); return }
      setAberto(false)
      router.refresh()
    })
  }

  const remover = () => {
    setErro('')
    startTransition(async () => {
      const r = await removerCortesia(userId)
      if (r?.error) { setErro(r.error); return }
      router.refresh()
    })
  }

  if (!aberto) {
    return (
      <div className="flex flex-col items-center gap-1">
        {emVigor && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
            cortesia ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'
          }`}>
            {cortesia ? 'Cortesia' : 'Assinante'} · {planoAtual} até {data}
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAberto(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            <Gift className="w-3.5 h-3.5" />
            {emVigor ? 'Estender' : 'Liberar plano'}
          </button>
          {cortesia && (
            <button
              onClick={remover}
              disabled={isPending}
              className="px-2 py-1 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50 transition-colors disabled:opacity-60"
              title="Tirar a cortesia agora"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        {erro && <span className="text-[11px] text-red-600">{erro}</span>}
      </div>
    )
  }

  return (
    <div className="text-left bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2 min-w-[14rem]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-indigo-900">Liberar para {nome.split(' ')[0]}</span>
        <button onClick={() => setAberto(false)} className="text-indigo-400 hover:text-indigo-700">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <select
        value={plano}
        onChange={(e) => setPlano(e.target.value)}
        className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white"
      >
        {PAGOS.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </select>

      <select
        value={dias}
        onChange={(e) => setDias(Number(e.target.value))}
        className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white"
      >
        {PRAZOS.map((d) => (
          <option key={d} value={d}>{d} dias</option>
        ))}
      </select>

      {emVigor && (
        <p className="text-[11px] text-indigo-800">Soma ao que já vale até {data}.</p>
      )}

      {erro && (
        <div className="flex items-start gap-1.5 text-[11px] text-red-700">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      <button
        onClick={liberar}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Liberar sem cobrança
      </button>
    </div>
  )
}
