'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, Trash2, ExternalLink, Clock, CheckCircle2 } from 'lucide-react'
import { cn, formatArea } from '@/lib/utils'

interface SavedSearch {
  id: string
  name: string
  filters: Record<string, any>
  active: boolean
  lastNotifiedAt: string | null
  createdAt: string
}

const FILTER_LABELS: Record<string, string> = {
  type: 'Tipo', listingType: 'Finalidade', city: 'Cidade',
  state: 'Estado', minPrice: 'Preço mín.', maxPrice: 'Preço máx.',
  bedrooms: 'Quartos', q: 'Busca', minArea: 'Área mín.', maxArea: 'Área máx.',
}

const TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno',
  FARM: 'Fazenda / Sítio / Chácara', COMMERCIAL: 'Comercial',
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda e Aluguel',
}

function formatFilterValue(key: string, value: any, propertyType?: string): string {
  if (key === 'minPrice' || key === 'maxPrice') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
  }
  // A área da busca fica em m²; em buscas rurais aparece em hectares
  if (key === 'minArea' || key === 'maxArea') return formatArea(Number(value), propertyType)
  if (key === 'bedrooms') return `${value}+`
  return TYPE_LABELS[value] || value
}

function buildSearchUrl(filters: Record<string, any>): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  return `/imoveis?${params.toString()}`
}

export default function AlertsManager({ initialSearches }: { initialSearches: SavedSearch[] }) {
  const [searches, setSearches] = useState(initialSearches)

  const toggle = async (id: string, active: boolean) => {
    const res = await fetch('/api/alertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    })
    if (res.ok) {
      setSearches(ss => ss.map(s => s.id === id ? { ...s, active } : s))
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remover este alerta?')) return
    const res = await fetch(`/api/alertas?id=${id}`, { method: 'DELETE' })
    if (res.ok) setSearches(ss => ss.filter(s => s.id !== id))
  }

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))

  return (
    <div className="space-y-3">
      {searches.map(search => {
        const activeFilters = Object.entries(search.filters).filter(([, v]) => v)
        return (
          <div key={search.id} className={cn(
            'bg-white rounded-2xl border shadow-sm p-5 transition-opacity',
            !search.active && 'opacity-60',
            search.active ? 'border-gray-100' : 'border-dashed border-gray-300'
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  search.active ? 'bg-indigo-100' : 'bg-gray-100'
                )}>
                  {search.active
                    ? <Bell className="w-5 h-5 text-indigo-600" />
                    : <BellOff className="w-5 h-5 text-gray-400" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{search.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Criado em {formatDate(search.createdAt)}
                    {search.lastNotifiedAt && (
                      <span className="flex items-center gap-0.5 ml-2 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Último aviso: {formatDate(search.lastNotifiedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link href={buildSearchUrl(search.filters)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Ver busca">
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => toggle(search.id, !search.active)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    search.active
                      ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  )}
                  title={search.active ? 'Pausar alerta' : 'Ativar alerta'}>
                  {search.active ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => remove(search.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remover alerta">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtros ativos */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                {activeFilters.map(([k, v]) => (
                  <span key={k} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {FILTER_LABELS[k] || k}: <strong>{formatFilterValue(k, v, search.filters.type)}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-gray-400 text-center pt-2">
        {searches.length}/10 alertas • Para criar mais, remova algum existente
      </p>
    </div>
  )
}
