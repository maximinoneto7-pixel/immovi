'use client'

import { useState } from 'react'
import { Rocket, Zap, CheckCircle2 } from 'lucide-react'
import { FOGUETES, formatPrice } from '@/lib/stripe'
import { cn } from '@/lib/utils'
import AsaasCheckout from '@/components/pagamentos/AsaasCheckout'

interface BoostPanelProps {
  propertyId: string
  currentBoost?: { boostType: string; expiresAt: Date } | null
}

export default function BoostPanel({ propertyId, currentBoost }: BoostPanelProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  const isActive = currentBoost && new Date(currentBoost.expiresAt) > new Date()
  const selectedFoguete = selected ? FOGUETES[selected as keyof typeof FOGUETES] : null

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
        <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <Rocket className="w-4 h-4 fill-current" />
            Destaque até {new Date(currentBoost!.expiresAt).toLocaleDateString('pt-BR')}
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Faltam {Math.max(1, Math.ceil((new Date(currentBoost!.expiresAt).getTime() - Date.now()) / 86400000))} dia(s).
            Depois disso o anúncio volta à posição normal. Comprar outro Foguete agora soma ao prazo que resta.
          </p>
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
            onClick={() => setShowCheckout(true)}
            disabled={!selected}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Rocket className="w-4 h-4" /> Ativar Foguete
          </button>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5" />
            Pagamento seguro via Asaas — PIX, boleto ou cartão
          </div>
        </>
      )}

      {showCheckout && selectedFoguete && (
        <AsaasCheckout
          type="boost"
          boostType={selectedFoguete.id}
          propertyId={propertyId}
          price={selectedFoguete.preco / 100}
          description={`Foguete — ${selectedFoguete.label}`}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
