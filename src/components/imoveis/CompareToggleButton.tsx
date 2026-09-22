'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCompareIds, toggleCompareId, COMPARE_EVENT } from '@/lib/compare'

export default function CompareToggleButton({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [isComparing, setIsComparing] = useState(false)

  useEffect(() => {
    const sync = () => setIsComparing(getCompareIds().includes(propertyId))
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    return () => window.removeEventListener(COMPARE_EVENT, sync)
  }, [propertyId])

  const handleClick = () => {
    const next = toggleCompareId(propertyId)
    const nowComparing = next.includes(propertyId)
    setIsComparing(nowComparing)
    // Ao adicionar ao comparador, leva para a listagem para escolher os outros imóveis
    if (nowComparing) router.push('/imoveis')
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm font-medium transition-colors',
        isComparing
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
      )}
    >
      <ArrowLeftRight className="w-4 h-4" />
      {isComparing ? 'Comparando' : 'Comparar'}
    </button>
  )
}
