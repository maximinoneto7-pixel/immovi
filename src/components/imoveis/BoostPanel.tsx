'use client'

import { useState } from 'react'
import { Rocket, Zap, CheckCircle2, Loader2 } from 'lucide-react'
import { FOGUETES, formatPrice } from '@/lib/stripe'
import { cn } from '@/lib/utils'

interface BoostPanelProps {
  propertyId: string
  currentBoost?: { boostType: string; expiresAt: Date } | null
}

export default function BoostPanel({ propertyId, currentBoost }: BoostPanelProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const isActive = currentBoost && new Date(currentBoost.expiresAt) > new Date()

  const handleBoost = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, boostType: selected }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else if (data.error) {
        alert(data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
        <Rocket className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <div className="font-bold text-gray-900 mb-1">🚀 Foguete ativado!</div>
        <p className="text-sm text-gray-600">Seu anúncio agora aparece no topo dos resultados.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Rocket className="w-5 h-5 text-amber-500" />
        Foguete — Aparecer em 1º lugar
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Seu imóvel aparece fixado no topo de todos os resultados da sua cidade e tipo.
      </p>

      {isActive ? (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm font-medium text-amber-700">
          <Rocket className="w-4 h-4 fill-current" />
          Foguete ativo até {new Date(currentBoost!.expiresAt).toLocaleDateString('pt-BR')}
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {Object.values(FOGUETES).map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-sm',
                  selected === f.id
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <Rocket className={cn('w-4 h-4', selected === f.id ? 'text-amber-500' : 'text-gray-400')} />
                  <span className="font-semibold text-gray-800">{f.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{formatPrice(f.preco)}</span>
                  {selected === f.id && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleBoost}
            disabled={!selected || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
            ) : (
              <><Rocket className="w-4 h-4" /> Ativar Foguete</>
            )}
          </button>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5" />
            Pagamento seguro — ativação imediata
          </div>
        </>
      )}
    </div>
  )
}
