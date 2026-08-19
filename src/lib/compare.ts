const KEY = 'immovi-compare'
export const COMPARE_MAX = 4
export const COMPARE_EVENT = 'immovi-compare-changed'

export function getCompareIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT, { detail: ids }))
}

export function toggleCompareId(id: string): string[] {
  const current = getCompareIds()
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : current.length >= COMPARE_MAX
      ? current
      : [...current, id]
  persist(next)
  return next
}

export function clearCompare() {
  persist([])
}
