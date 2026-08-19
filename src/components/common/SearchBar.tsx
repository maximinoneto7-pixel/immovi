'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Home, ChevronDown, ArrowLeftRight } from 'lucide-react'
import { PROPERTY_TYPES } from '@/lib/utils'
import LocationAutocomplete from './LocationAutocomplete'

interface SearchBarProps {
  className?: string
  initialValues?: { q?: string; type?: string; listingType?: string }
}

export default function SearchBar({ className = '', initialValues }: SearchBarProps) {
  const router = useRouter()
  const [location, setLocation] = useState(initialValues?.q || '')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [type, setType] = useState(initialValues?.type || '')
  const [listingType, setListingType] = useState(initialValues?.listingType || '')
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

  const handleLocationChange = (value: string, city?: string, state?: string) => {
    setLocation(value)
    setSelectedCity(city || '')
    setSelectedState(state || '')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (selectedCity) params.set('city', selectedCity)
    else if (location) params.set('q', location)
    if (selectedState) params.set('state', selectedState)
    if (type) params.set('type', type)
    if (listingType) params.set('listingType', listingType)
    router.push(`/imoveis?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white rounded-2xl shadow-2xl ${className}`}
    >
      {/* Mobile: empilhado */}
      <div className="flex flex-col sm:hidden gap-0 divide-y divide-gray-100">
        <div className="px-4 py-3">
          <LocationAutocomplete value={location} onChange={handleLocationChange} placeholder="Cidade, estado ou bairro..." />
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Home className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none">
            <option value="">Tipo de Imóvel</option>
            {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <ChevronDown className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <select value={listingType} onChange={(e) => setListingType(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none">
            <option value="">Comprar ou Alugar</option>
            <option value="SALE">Comprar</option>
            <option value="RENT">Alugar</option>
          </select>
        </div>
        <button type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-b-2xl hover:bg-indigo-700 transition-colors">
          <Search className="w-4 h-4" /> Buscar
        </button>
      </div>

      {/* Desktop: linha única — altura e larguras fixas para nunca cortar texto */}
      <div className="hidden sm:flex items-stretch h-16">

        {/* Localização — expande para preencher o espaço restante */}
        <div className="flex items-center px-5 flex-1 min-w-0 border-r border-gray-100">
          <LocationAutocomplete
            value={location}
            onChange={handleLocationChange}
            placeholder="Cidade, estado ou bairro..."
            className="flex-1"
          />
        </div>

        {/* Tipo de Imóvel — largura suficiente para "Tipo de Imóvel" completo */}
        <div className="relative flex items-center flex-shrink-0 w-[210px] border-r border-gray-100 hover:bg-gray-50 transition-colors">
          <Home className="absolute left-4 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
          <ChevronDown className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none z-10" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-full pl-10 pr-8 bg-transparent text-sm text-gray-700 outline-none cursor-pointer appearance-none"
          >
            <option value="">Tipo de Imóvel</option>
            {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}{typeCounts[k] ? ` (${typeCounts[k]})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Comprar ou Alugar — largura suficiente para "Comprar ou Alugar" completo */}
        <div className="relative flex items-center flex-shrink-0 w-[210px] border-r border-gray-100 hover:bg-gray-50 transition-colors">
          <ArrowLeftRight className="absolute left-4 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
          <ChevronDown className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none z-10" />
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className="w-full h-full pl-10 pr-8 bg-transparent text-sm text-gray-700 outline-none cursor-pointer appearance-none"
          >
            <option value="">Comprar ou Alugar</option>
            <option value="SALE">Comprar</option>
            <option value="RENT">Alugar</option>
          </select>
        </div>

        {/* Botão Buscar */}
        <button
          type="submit"
          className="flex items-center gap-2 px-8 bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors rounded-r-2xl flex-shrink-0"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </div>
    </form>
  )
}
