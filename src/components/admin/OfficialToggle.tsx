'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Botão do admin para marcar a conta como oficial da Immovi */
export default function OfficialToggle({ userId, initial }: { userId: string; initial: boolean }) {
  const [official, setOfficial] = useState(initial)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (!official && !confirm('Os anúncios desta conta passarão a aparecer como "Oficial Immovi". Confirmar?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/oficial`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ official: !official }),
      })
      if (res.ok) setOfficial(!official)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        'mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-60',
        official ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-gray-200 text-gray-500 hover:bg-gray-50',
      )}
    >
      {busy && <Loader2 className="w-3 h-3 animate-spin" />}
      {official ? '✓ Conta oficial' : 'Tornar oficial'}
    </button>
  )
}
