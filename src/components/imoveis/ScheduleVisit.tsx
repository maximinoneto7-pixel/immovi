'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Loader2, Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERIODO_LABEL: Record<string, string> = {
  MANHA: 'Manhã (8h–12h)',
  TARDE: 'Tarde (13h–18h)',
  NOITE: 'Noite (18h–21h)',
}

export interface DiaDisponivel {
  /** ISO curto, só a data */
  data: string
  periodos: string[]
}

/** O comprador escolhe um dos dias que o anunciante liberou */
export default function ScheduleVisit({
  propertyId,
  dias,
  recado,
  isLoggedIn,
}: {
  propertyId: string
  dias: DiaDisponivel[]
  recado?: string | null
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [dia, setDia] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const diaEscolhido = dias.find((d) => d.data === dia)

  const pedir = () => {
    setErro('')
    startTransition(async () => {
      const res = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, date: dia, period: periodo, message: mensagem }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(data.error || 'Não consegui pedir a visita.'); return }
      setEnviado(true)
      router.refresh()
    })
  }

  const rotulo = (iso: string) => {
    const d = new Date(iso)
    return {
      semana: d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
      dia: d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' }),
    }
  }

  if (enviado) {
    return (
      <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Pedido enviado. O anunciante confirma e você recebe o aviso por e-mail — o endereço completo vem junto da confirmação.
        </span>
      </div>
    )
  }

  if (!aberto) {
    return (
      <button
        onClick={() => (isLoggedIn ? setAberto(true) : router.push(`/login?redirect=/imoveis/${propertyId}`))}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
      >
        <CalendarDays className="w-4 h-4 text-indigo-500" />
        Agendar visita
      </button>
    )
  }

  return (
    <div className="border border-indigo-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">Escolha o dia da visita</h3>
        <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {recado && <p className="text-xs text-gray-500">“{recado}”</p>}

      {erro && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {dias.slice(0, 14).map((d) => {
          const r = rotulo(d.data)
          return (
            <button
              key={d.data}
              onClick={() => { setDia(d.data); setPeriodo(null) }}
              className={cn(
                'flex-none w-14 py-2 rounded-xl border text-center transition-colors',
                dia === d.data ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200',
              )}
            >
              <span className="block text-[10px] text-gray-400">{r.semana}</span>
              <span className="block text-sm font-bold">{r.dia}</span>
            </button>
          )
        })}
      </div>

      {diaEscolhido && (
        <div className="flex flex-wrap gap-2">
          {diaEscolhido.periodos.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-semibold border transition-colors',
                periodo === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-200',
              )}
            >
              {PERIODO_LABEL[p] || p}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        rows={2}
        placeholder="Um recado para o anunciante (opcional). Ex.: chego por volta das 9h, vou com minha esposa."
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      <button
        onClick={pedir}
        disabled={isPending || !dia || !periodo}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
        Pedir visita
      </button>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        O anunciante precisa confirmar. Nunca pague nada antes de visitar e conferir a matrícula no cartório.
      </p>
    </div>
  )
}
