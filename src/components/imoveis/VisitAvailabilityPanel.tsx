'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const DIAS = [
  { n: 0, label: 'dom' }, { n: 1, label: 'seg' }, { n: 2, label: 'ter' }, { n: 3, label: 'qua' },
  { n: 4, label: 'qui' }, { n: 5, label: 'sex' }, { n: 6, label: 'sáb' },
]
const PERIODOS = [
  { id: 'MANHA', label: 'Manhã', faixa: '8h–12h' },
  { id: 'TARDE', label: 'Tarde', faixa: '13h–18h' },
  { id: 'NOITE', label: 'Noite', faixa: '18h–21h' },
]

/** Painel do dono do anúncio: quando ele pode receber visitas */
export default function VisitAvailabilityPanel({
  propertyId,
  inicial,
}: {
  propertyId: string
  inicial: { weekdays: string; periods: string; minDays: number; note: string | null } | null
}) {
  const router = useRouter()
  const [dias, setDias] = useState<number[]>(
    (inicial?.weekdays || '1,2,3,4,5').split(',').filter(Boolean).map(Number),
  )
  const [periodos, setPeriodos] = useState<string[]>(
    (inicial?.periods || 'MANHA,TARDE').split(',').filter(Boolean),
  )
  const [minDays, setMinDays] = useState(String(inicial?.minDays ?? 1))
  const [nota, setNota] = useState(inicial?.note || '')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const alterna = <T,>(lista: T[], valor: T) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]

  const salvar = () => {
    setErro(''); setSalvo(false)
    startTransition(async () => {
      const res = await fetch(`/api/imoveis/${propertyId}/visitas-disponibilidade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekdays: dias.sort().join(','),
          periods: periodos.join(','),
          minDays: Number(minDays),
          note: nota,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(data.error || 'Não consegui salvar.'); return }
      setSalvo(true)
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-indigo-500" />
        Quando posso receber visitas
      </h3>

      {erro && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      <div>
        <div className="text-xs font-medium text-gray-600 mb-1.5">Dias da semana</div>
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => setDias((v) => alterna(v, d.n))}
              className={cn(
                'py-2 rounded-lg text-xs font-semibold border transition-colors',
                dias.includes(d.n)
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                  : 'border-gray-200 text-gray-400 hover:border-indigo-200',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-gray-600 mb-1.5">Períodos</div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodos((v) => alterna(v, p.id))}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-semibold border transition-colors',
                periodos.includes(p.id)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-200 text-gray-500 hover:border-indigo-200',
              )}
            >
              {p.label} <span className="font-normal opacity-80">{p.faixa}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Aviso mínimo</label>
        <select
          value={minDays}
          onChange={(e) => setMinDays(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="1">1 dia de antecedência</option>
          <option value="2">2 dias</option>
          <option value="3">3 dias</option>
          <option value="7">1 semana</option>
        </select>
      </div>

      <input
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Recado para quem for visitar (opcional)"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        onClick={salvar}
        disabled={isPending || dias.length === 0 || periodos.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : salvo ? <Check className="w-4 h-4" /> : null}
        {salvo ? 'Horários salvos' : 'Salvar horários'}
      </button>

      <p className="text-xs text-gray-500 leading-relaxed">
        Você confirma cada pedido antes de valer, e o endereço completo só vai para o visitante depois disso.
        Sem horários marcados, o botão de visita volta a ser um pedido escrito no chat.
      </p>
    </div>
  )
}
