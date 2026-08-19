'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Zap, Star, Crown, Loader2, CreditCard } from 'lucide-react'
import { formatPrice, PLANOS, type PlanoId } from '@/lib/stripe'
import { cn } from '@/lib/utils'

interface PlansClientProps {
  plans: typeof PLANOS
  currentPlan: string
  isLoggedIn: boolean
}

const ICONS: Record<PlanoId, React.ElementType> = {
  BASIC: Star,
  DESTAQUE: Zap,
  PROFISSIONAL: Crown,
  IMOBILIARIA: Crown,
}

const COLORS: Record<PlanoId, { ring: string; btn: string; badge: string }> = {
  BASIC:        { ring: 'border-gray-200', btn: 'bg-gray-600 hover:bg-gray-700', badge: 'bg-gray-100 text-gray-600' },
  DESTAQUE:     { ring: 'border-indigo-400 ring-2 ring-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  PROFISSIONAL: { ring: 'border-violet-400 ring-2 ring-violet-400', btn: 'bg-violet-600 hover:bg-violet-700', badge: 'bg-violet-100 text-violet-700' },
  IMOBILIARIA:  { ring: 'border-amber-400 ring-2 ring-amber-400', btn: 'bg-amber-500 hover:bg-amber-600', badge: 'bg-amber-100 text-amber-700' },
}

export default function PlansClient({ plans, currentPlan, isLoggedIn }: PlansClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: PlanoId, billingType: 'CREDIT_CARD' | 'UNDEFINED') => {
    if (!isLoggedIn) { router.push('/login?redirect=/planos'); return }
    if (planId === 'BASIC') return
    if (planId === currentPlan) return

    setLoading(planId)
    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'plan', planId, billingType }),
      })
      const data = await res.json()
      if (data.invoiceUrl) window.location.href = data.invoiceUrl
      else if (data.error) alert(data.error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.entries(plans) as [PlanoId, typeof plans[PlanoId]][]).map(([id, plan]) => {
          const c = COLORS[id]
          const Icon = ICONS[id]
          const isCurrent = currentPlan === id
          const isPopular = id === 'DESTAQUE'

          return (
            <div key={id} className={cn(
              'bg-white rounded-2xl border shadow-sm flex flex-col relative overflow-hidden transition-all hover:shadow-md',
              c.ring
            )}>
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
              )}
              {isPopular && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                  POPULAR
                </div>
              )}

              <div className="p-6 flex-1">
                {/* Header */}
                <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4', c.badge)}>
                  <Icon className="w-3.5 h-3.5" />
                  {plan.nome}
                </div>

                {/* Preço */}
                <div className="mb-1">
                  {plan.preco === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">Grátis</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(plan.preco)}
                      </span>
                      <span className="text-gray-400 text-sm">/mês</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-5">{plan.descricao}</p>

                {/* Recursos */}
                <ul className="space-y-2.5">
                  {plan.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botão */}
              <div className="p-6 pt-0">
                {isCurrent ? (
                  <div className="w-full py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold text-center">
                    ✓ Plano atual
                  </div>
                ) : plan.preco === 0 ? (
                  <button
                    onClick={() => handleSelectPlan(id, 'UNDEFINED')}
                    disabled={loading === id}
                    className={cn(
                      'w-full py-3 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                      c.btn,
                      'disabled:opacity-60'
                    )}
                  >
                    Começar grátis
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSelectPlan(id, 'CREDIT_CARD')}
                      disabled={loading === id}
                      className={cn(
                        'w-full py-3 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                        c.btn,
                        'disabled:opacity-60'
                      )}
                    >
                      {loading === id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
                      ) : (
                        <><CreditCard className="w-4 h-4" /> Assinar {plan.nome}</>
                      )}
                    </button>
                    <button
                      onClick={() => handleSelectPlan(id, 'UNDEFINED')}
                      disabled={loading === id}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
                    >
                      ou pagar com PIX/Boleto (renovação manual todo mês)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabela comparativa */}
      <div className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Comparação detalhada</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Recurso</th>
                {(Object.values(plans)).map((p) => (
                  <th key={p.id} className="text-center px-4 py-4 font-semibold text-gray-900">{p.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Anúncios ativos', fn: (p: typeof plans[PlanoId]) => p.anuncios === 999 ? 'Ilimitado' : String(p.anuncios) },
                { label: 'Destaques', fn: (p: typeof plans[PlanoId]) => String(p.destaques) },
                { label: 'Foguetes/mês', fn: (p: typeof plans[PlanoId]) => String(p.foguetes) },
                { label: 'Badge verificado', fn: (p: typeof plans[PlanoId]) => p.verificacao ? '✓' : '—' },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-3.5 text-gray-700 font-medium">{row.label}</td>
                  {(Object.values(plans)).map((p) => (
                    <td key={p.id} className="text-center px-4 py-3.5 text-gray-700">
                      {row.fn(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
