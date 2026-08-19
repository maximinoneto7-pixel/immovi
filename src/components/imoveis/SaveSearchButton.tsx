'use client'

import { useState } from 'react'
import { Bell, BellOff, CheckCircle2, Loader2, X } from 'lucide-react'

interface SaveSearchButtonProps {
  filters: Record<string, string | undefined>
  isLoggedIn: boolean
}

export default function SaveSearchButton({ filters, isLoggedIn }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== 'page')

  if (!activeFilters.length) return null

  const handleSave = async () => {
    if (!name.trim()) { setError('Digite um nome para o alerta.'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          filters: Object.fromEntries(
            Object.entries(filters)
              .filter(([k, v]) => v && k !== 'page')
              .map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])
          ),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => { setOpen(false); setSaved(false); setName('') }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alerta.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <a href="/login?redirect=/imoveis"
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Criar alerta</span>
      </a>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Criar alerta</span>
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          {/* Popup */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                <Bell className="w-4 h-4 text-indigo-500" />
                Criar alerta desta busca
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {saved ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                  <p className="font-semibold text-gray-900 text-sm">Alerta criado!</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Você receberá e-mail quando novos imóveis aparecerem.
                  </p>
                </div>
              ) : (
                <>
                  {/* Filtros ativos */}
                  <div className="flex flex-wrap gap-1.5">
                    {activeFilters.map(([k, v]) => {
                      const labels: Record<string, string> = {
                        type: 'Tipo', listingType: 'Finalidade', city: 'Cidade',
                        state: 'Estado', minPrice: 'Preço mín.', maxPrice: 'Preço máx.',
                        bedrooms: 'Quartos', q: 'Busca',
                      }
                      return (
                        <span key={k} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {labels[k] || k}: {v}
                        </span>
                      )
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nome do alerta
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSave()}
                      placeholder='Ex: "Casa em SP até R$ 500k"'
                      autoFocus
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {error && <p className="text-xs text-red-600">{error}</p>}

                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Bell className="w-4 h-4" />Salvar alerta</>}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Você receberá um e-mail quando novos imóveis combinarem com esta busca.
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
