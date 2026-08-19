'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LayoutGrid, Map, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import dinâmico do mapa (sem SSR — Leaflet precisa do window)
const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-2xl bg-gray-100 flex items-center justify-center">
      <div className="text-center space-y-2">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Carregando mapa...</p>
      </div>
    </div>
  ),
})

interface MapToggleProps {
  properties: any[]
}

export default function MapToggle({ properties }: MapToggleProps) {
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [geocodedProps, setGeocodedProps] = useState(properties)
  const [geocoding, setGeocoding] = useState(false)

  // Quando muda para mapa, geocodifica propriedades sem coordenadas
  useEffect(() => {
    if (view !== 'map') return

    // Mostra/esconde o grid
    const grid = document.getElementById('grid-view')
    if (grid) grid.style.display = 'none'

    // Geocodifica as que não têm lat/lng
    const withoutCoords = properties.filter(p => !p.latitude || !p.longitude)
    if (!withoutCoords.length) {
      setGeocodedProps(properties)
      return
    }

    setGeocoding(true)

    Promise.allSettled(
      withoutCoords.map(async (p) => {
        try {
          const res = await fetch(
            `/api/geocode?city=${encodeURIComponent(p.city)}&state=${encodeURIComponent(p.state)}`
          )
          const data = await res.json()
          return { id: p.id, lat: data.lat, lng: data.lng }
        } catch {
          return { id: p.id, lat: null, lng: null }
        }
      })
    ).then(results => {
      const coordMap: Record<string, { lat: number; lng: number }> = {}
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.lat) {
          coordMap[r.value.id] = { lat: r.value.lat, lng: r.value.lng }
        }
      })

      setGeocodedProps(properties.map(p => ({
        ...p,
        latitude: p.latitude || coordMap[p.id]?.lat || null,
        longitude: p.longitude || coordMap[p.id]?.lng || null,
      })))
      setGeocoding(false)
    })
  }, [view, properties])

  // Mostra o grid ao voltar
  useEffect(() => {
    if (view === 'grid') {
      const grid = document.getElementById('grid-view')
      if (grid) grid.style.display = ''
    }
  }, [view])

  return (
    <>
      {/* Botões de toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setView('grid')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            view === 'grid'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Lista</span>
        </button>
        <button
          onClick={() => setView('map')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            view === 'map'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Map className="w-4 h-4" />
          <span className="hidden sm:inline">Mapa</span>
          {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
        </button>
      </div>

      {/* Mapa (renderizado abaixo do grid quando ativo) */}
      {view === 'map' && (
        <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col" style={{ top: '56px' }}>
          {/* Barra superior do mapa */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">
                {geocodedProps.filter(p => p.latitude && p.longitude).length} imóveis no mapa
              </span>
            </div>
            <button
              onClick={() => setView('grid')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Voltar para lista
            </button>
          </div>

          {/* Mapa em tela cheia */}
          <div className="flex-1">
            <PropertyMap
              properties={geocodedProps}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  )
}
