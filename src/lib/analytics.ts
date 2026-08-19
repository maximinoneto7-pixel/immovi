export interface DayBucket {
  date: string
  label: string
  value: number
}

export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => Date,
  days: number,
  accumulate: (item: T) => number = () => 1
): DayBucket[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets: DayBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    buckets.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: 0,
    })
  }

  const byDate = new Map(buckets.map((b) => [b.date, b]))
  for (const item of items) {
    const key = getDate(item).toISOString().slice(0, 10)
    const bucket = byDate.get(key)
    if (bucket) bucket.value += accumulate(item)
  }

  return buckets
}
