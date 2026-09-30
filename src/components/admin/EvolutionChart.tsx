import type { DayBucket } from '@/lib/analytics'

interface EvolutionChartProps {
  data: DayBucket[]
  color: string
  formatValue?: (value: number) => string
}

export default function EvolutionChart({ data, color, formatValue }: EvolutionChartProps) {
  const max = Math.max(...data.map((d) => d.value))
  const format = formatValue || ((v: number) => v.toLocaleString('pt-BR'))
  const total = data.reduce((a, d) => a + d.value, 0)
  const escala = Math.max(1, max)
  // Um rótulo a cada N colunas, para as datas não se atropelarem
  const passo = Math.ceil(data.length / 7)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 text-xs">
        <span className="text-gray-400">
          Total no período: <span className="font-semibold text-gray-600">{format(total)}</span>
        </span>
        {max > 0 && <span className="text-gray-400">pico {format(max)}</span>}
      </div>

      <div className="flex items-end gap-1 border-b border-gray-200" style={{ height: 110 }}>
        {data.map((d) => (
          <div
            key={d.date}
            className="flex-1 h-full flex flex-col justify-end rounded-t bg-gray-50"
            title={`${d.label}: ${format(d.value)}`}
          >
            {d.value > 0 && (
              <div
                className={`w-full rounded-t ${color} transition-all`}
                style={{ height: `${Math.max(6, Math.round((d.value / escala) * 100))}%` }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-1 mt-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center text-[9px] text-gray-400">
            {i % passo === 0 ? d.label : ''}
          </div>
        ))}
      </div>

      {total === 0 && <p className="text-xs text-gray-400 mt-2">Nada registrado nesse período.</p>}
    </div>
  )
}
