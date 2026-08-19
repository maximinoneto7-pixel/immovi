import type { DayBucket } from '@/lib/analytics'

interface EvolutionChartProps {
  data: DayBucket[]
  color: string
  formatValue?: (value: number) => string
}

export default function EvolutionChart({ data, color, formatValue }: EvolutionChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const format = formatValue || ((v: number) => v.toLocaleString('pt-BR'))

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 110 }}>
        {data.map((d) => (
          <div
            key={d.date}
            className="flex-1 h-full flex flex-col justify-end"
            title={`${d.label}: ${format(d.value)}`}
          >
            <div
              className={`w-full rounded-t ${color} min-h-[3px] transition-all`}
              style={{ height: `${Math.max(3, Math.round((d.value / max) * 100))}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center text-[9px] text-gray-400">
            {i % Math.ceil(data.length / 7) === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
