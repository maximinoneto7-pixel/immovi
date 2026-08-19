'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, X } from 'lucide-react'
import { getCompareIds, clearCompare, COMPARE_EVENT, COMPARE_MAX } from '@/lib/compare'

export default function CompareBar() {
  const router = useRouter()
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setIds(getCompareIds())
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (ids.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Scale className="w-4 h-4 text-indigo-400" />
        {ids.length} de {COMPARE_MAX} selecionado{ids.length !== 1 ? 's' : ''}
      </div>
      <button
        onClick={() => router.push(`/comparar?ids=${ids.join(',')}`)}
        disabled={ids.length < 2}
        className="px-4 py-1.5 bg-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Comparar
      </button>
      <button
        onClick={clearCompare}
        className="p-1.5 text-gray-400 hover:text-white transition-colors"
        aria-label="Limpar seleção"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
