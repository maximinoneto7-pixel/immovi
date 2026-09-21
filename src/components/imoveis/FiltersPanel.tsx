'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { PROPERTY_TYPES, M2_PER_HECTARE, isRural } from '@/lib/utils'
import LocationAutocomplete from '@/components/common/LocationAutocomplete'

interface FiltersPanelProps {
  currentParams: Record<string, string | undefined>
}

export default function FiltersPanel({ currentParams }: FiltersPanelProps) {
  const router = useRouter()
  const [open, setOpen] = useState<Record<string, boolean>>({
    tipo: true, finalidade: true, preco: true, local: true, quartos: true, area: false,
  })
  // A URL guarda a área sempre em m²; para imóvel rural o painel mostra e recebe hectares
  const toDisplayArea = (m2: string | undefined, type: string | undefined) =>
    m2 && isRural(type) ? String(Number(m2) / M2_PER_HECTARE) : (m2 || '')

  const [filters, setFilters] = useState({
    type: currentParams.type || '',
    listingType: currentParams.listingType || '',
    minPrice: currentParams.minPrice || '',
    maxPrice: currentParams.maxPrice || '',
    state: currentParams.state || '',
    city: currentParams.city || '',
    bedrooms: currentParams.bedrooms || '',
    minArea: toDisplayArea(currentParams.minArea, currentParams.type),
    maxArea: toDisplayArea(currentParams.maxArea, currentParams.type),
  })
  const [cityInput, setCityInput] = useState(
    currentParams.city
      ? `${currentParams.city}${currentParams.state ? `, ${currentParams.state}` : ''}`
      : ''
  )
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/locations?type=type-counts')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, number> = {}
        d.counts?.forEach((c: { type: string; count: number }) => { map[c.type] = c.count })
        setTypeCounts(map)
      })
      .catch(() => {})
  }, [])

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }))

  // Rural ↔ urbano muda a unidade da área, então os valores digitados não valem mais
  const setType = (type: string) => setFilters((f) => ({
    ...f,
    type,
    ...(isRural(type) !== isRural(f.type) ? { minArea: '', maxArea: '' } : {}),
  }))

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (currentParams.q) params.set('q', currentParams.q)
    Object.entries(filters).forEach(([k, v]) => {
      if (!v) return
      const isArea = k === 'minArea' || k === 'maxArea'
      params.set(k, isArea && isRural(filters.type) ? String(Math.round(Number(v) * M2_PER_HECTARE)) : v)
    })
    router.push(`/imoveis?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({ type: '', listingType: '', minPrice: '', maxPrice: '', state: '', city: '', bedrooms: '', minArea: '', maxArea: '' })
    setCityInput('')
    router.push('/imoveis')
  }

  const Section = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <button onClick={() => toggle(id)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-3">
        {label}
        {open[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open[id] && children}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
          <SlidersHorizontal className="w-4 h-4" /> Filtros
        </div>
        <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <RotateCcw className="w-3 h-3" /> Limpar
        </button>
      </div>

      <div className="px-4">
        {/* Finalidade */}
        <Section id="finalidade" label="Finalidade">
          <div className="flex gap-2">
            {[{ val: '', label: 'Todos' }, { val: 'SALE', label: 'Venda' }, { val: 'RENT', label: 'Aluguel' }].map((opt) => (
              <button key={opt.val} onClick={() => setFilters((f) => ({ ...f, listingType: opt.val }))}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${filters.listingType === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Tipo com contagens ao vivo */}
        <Section id="tipo" label="Tipo de Imóvel">
          <div className="space-y-1">
            <button onClick={() => setType('')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${filters.type === '' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>Todos os tipos</span>
              <span className="text-xs text-gray-400">{Object.values(typeCounts).reduce((a, b) => a + b, 0) || ''}</span>
            </button>
            {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
              <button key={key} onClick={() => setType(filters.type === key ? '' : key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${filters.type === key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{label}</span>
                {typeCounts[key] != null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filters.type === key ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                    {typeCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Preço */}
        <Section id="preco" label="Faixa de Preço">
          <div className="space-y-2">
            {[{ key: 'minPrice', placeholder: 'Preço mínimo' }, { key: 'maxPrice', placeholder: 'Preço máximo' }].map(({ key, placeholder }) => (
              <div key={key} className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">R$</span>
                <input type="number" placeholder={placeholder}
                  value={filters[key as keyof typeof filters]}
                  onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
        </Section>

        {/* Localização */}
        <Section id="local" label="Localização">
          <div className="border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <LocationAutocomplete
              value={cityInput}
              onChange={(value, city, state) => {
                setCityInput(value)
                setFilters((f) => ({
                  ...f,
                  city: city || '',
                  state: state || f.state,
                }))
              }}
              placeholder="Cidade ou estado..."
            />
          </div>
        </Section>

        {/* Quartos */}
        <Section id="quartos" label="Quartos">
          <div className="flex gap-2 flex-wrap">
            {['', '1', '2', '3', '4'].map((n) => (
              <button key={n} onClick={() => setFilters((f) => ({ ...f, bedrooms: n }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filters.bedrooms === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                {n === '' ? 'Todos' : n === '4' ? '4+' : n}
              </button>
            ))}
          </div>
        </Section>

        {/* Área */}
        <Section id="area" label={isRural(filters.type) ? 'Área (hectares)' : 'Área (m²)'}>
          <div className="space-y-2">
            {[{ key: 'minArea', placeholder: 'Área mínima' }, { key: 'maxArea', placeholder: 'Área máxima' }].map(({ key, placeholder }) => (
              <input key={key} type="number" step="any" placeholder={`${placeholder} (${isRural(filters.type) ? 'ha' : 'm²'})`}
                value={filters[key as keyof typeof filters]}
                onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            ))}
          </div>
        </Section>
      </div>

      <div className="px-4 pb-4">
        <button onClick={applyFilters}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 transition-colors">
          Aplicar Filtros
        </button>
      </div>
    </div>
  )
}
