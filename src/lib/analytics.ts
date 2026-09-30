export interface DayBucket {
  date: string
  label: string
  value: number
}

const TZ = 'America/Sao_Paulo'

/** Dia de uma data no horário de Brasília, como "2026-09-30" */
function diaEmBrasilia(d: Date) {
  // pt-BR devolve "30/09/2026"; invertemos para ordenar e comparar como texto
  const [dia, mes, ano] = d.toLocaleDateString('pt-BR', { timeZone: TZ }).split('/')
  return `${ano}-${mes}-${dia}`
}

/**
 * Agrupa registros por dia, sempre no fuso de Brasília.
 *
 * O servidor roda em UTC e o navegador no fuso de quem olha: sem fixar o fuso,
 * o que acontece depois das 21h caía no dia seguinte — ou sumia do gráfico.
 */
export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => Date,
  days: number,
  accumulate: (item: T) => number = () => 1
): DayBucket[] {
  const buckets: DayBucket[] = []
  const agora = Date.now()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(agora - i * 24 * 60 * 60 * 1000)
    buckets.push({
      date: diaEmBrasilia(d),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TZ }),
      value: 0,
    })
  }

  const byDate = new Map(buckets.map((b) => [b.date, b]))
  for (const item of items) {
    const bucket = byDate.get(diaEmBrasilia(getDate(item)))
    if (bucket) bucket.value += accumulate(item)
  }

  return buckets
}
