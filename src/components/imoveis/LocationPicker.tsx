'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { MapPin, LocateFixed, Loader2 } from 'lucide-react'

export interface LocationPickerHandle {
  setLatLng: (lat: number, lng: number) => void
}

interface LocationPickerProps {
  getAddress: () => { address: string; city: string; state: string }
  onChange: (lat: number, lng: number) => void
}

const LocationPicker = forwardRef<LocationPickerHandle, LocationPickerProps>(
  ({ getAddress, onChange }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const [searching, setSearching] = useState(false)
    const [hasPin, setHasPin] = useState(false)

    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) return

      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const start: [number, number] = [-15.7801, -47.9292]
        const map = L.map(mapRef.current!, { center: start, zoom: 4 })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        const marker = L.marker(start, { draggable: true, opacity: 0 }).addTo(map)

        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChange(pos.lat, pos.lng)
        })

        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng)
          marker.setOpacity(1)
          setHasPin(true)
          onChange(e.latlng.lat, e.latlng.lng)
        })

        mapInstanceRef.current = map
        markerRef.current = marker
      })

      return () => {
        mapInstanceRef.current?.remove()
        mapInstanceRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useImperativeHandle(ref, () => ({
      setLatLng(lat: number, lng: number) {
        if (!mapInstanceRef.current || !markerRef.current) return
        mapInstanceRef.current.setView([lat, lng], 16)
        markerRef.current.setLatLng([lat, lng])
        markerRef.current.setOpacity(1)
        setHasPin(true)
      },
    }))

    const handleSearch = async () => {
      const { address, city, state } = getAddress()
      if (!city || !state) return
      setSearching(true)
      try {
        const params = new URLSearchParams({ city, state })
        if (address) params.set('address', address)
        const res = await fetch(`/api/geocode?${params}`)
        const data = await res.json()
        if (data.lat && data.lng) {
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([data.lat, data.lng], 16)
            markerRef.current.setLatLng([data.lat, data.lng])
            markerRef.current.setOpacity(1)
            setHasPin(true)
          }
          onChange(data.lat, data.lng)
        }
      } finally {
        setSearching(false)
      }
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-500" /> Localização no mapa
          </label>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
            Buscar endereço no mapa
          </button>
        </div>
        <div
          ref={mapRef}
          className="w-full rounded-xl overflow-hidden border border-gray-200"
          style={{ height: 280 }}
        />
        <p className="text-xs text-gray-400 mt-1.5">
          {hasPin
            ? 'Arraste o marcador para ajustar o ponto exato, se precisar.'
            : 'Clique em "Buscar endereço no mapa" ou clique diretamente no mapa para marcar a localização exata.'}
        </p>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </div>
    )
  }
)

LocationPicker.displayName = 'LocationPicker'

export default LocationPicker
