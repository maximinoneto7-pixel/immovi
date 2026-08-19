'use client'

import { useEffect, useRef } from 'react'
import { formatCurrency, PROPERTY_TYPES } from '@/lib/utils'

interface MapProperty {
  id: string
  title: string
  price: number
  rentPrice?: number | null
  listingType: string
  type: string
  city: string
  state: string
  neighborhood?: string | null
  verified: boolean
  featured: boolean
  latitude?: number | null
  longitude?: number | null
  images: { url: string; isCover: boolean }[]
  owner: { name: string }
}

interface PropertyMapProps {
  properties: MapProperty[]
  className?: string
}

export default function PropertyMap({ properties, className = '' }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Importa Leaflet dinamicamente (evita SSR)
    import('leaflet').then((L) => {
      // Fix ícones padrão do Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Cria o mapa centrado no Brasil
      const map = L.map(mapRef.current!, {
        center: [-15.7801, -47.9292],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Tile layer OpenStreetMap (gratuito)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      // Adiciona marcadores
      addMarkers(L, map, properties)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Atualiza marcadores quando as propriedades mudam
  useEffect(() => {
    if (!mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Remove marcadores antigos
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      // Adiciona novos
      addMarkers(L, mapInstanceRef.current, properties)
    })
  }, [properties])

  function addMarkers(L: any, map: any, props: MapProperty[]) {
    const bounds: [number, number][] = []

    props.forEach((property) => {
      if (!property.latitude || !property.longitude) return

      const lat = property.latitude
      const lng = property.longitude
      bounds.push([lat, lng])

      const price = property.listingType === 'RENT'
        ? property.rentPrice || property.price
        : property.price

      const isRent = property.listingType === 'RENT'
      const cover = property.images?.find(i => i.isCover) || property.images?.[0]

      // Ícone personalizado com preço
      const priceFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
        notation: 'compact', maximumFractionDigits: 0,
      }).format(price)

      const color = property.featured ? '#f59e0b' : isRent ? '#7c3aed' : '#4338ca'
      const borderColor = property.featured ? '#d97706' : isRent ? '#6d28d9' : '#3730a3'

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            background:${color};
            color:#fff;
            border:2px solid ${borderColor};
            border-radius:20px;
            padding:4px 10px;
            font-size:12px;
            font-weight:700;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            cursor:pointer;
            font-family:Arial,sans-serif;
            position:relative;
          ">
            ${priceFormatted}${isRent ? '/mês' : ''}
            ${property.verified ? ' ✓' : ''}
          </div>
          <div style="
            width:0;height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:8px solid ${color};
            margin:0 auto;
          "></div>
        `,
        iconAnchor: [35, 40],
        popupAnchor: [0, -45],
      })

      const marker = L.marker([lat, lng], { icon })

      // Popup com info do imóvel
      const popupContent = `
        <div style="width:220px;font-family:Arial,sans-serif;">
          ${cover ? `
            <div style="border-radius:8px;overflow:hidden;margin-bottom:10px;height:120px;">
              <img src="${cover.url}" alt="${property.title}"
                style="width:100%;height:100%;object-fit:cover;"/>
            </div>
          ` : ''}
          <div style="font-size:11px;color:${color};font-weight:700;text-transform:uppercase;margin-bottom:2px;">
            ${PROPERTY_TYPES[property.type] || property.type}
            ${isRent ? ' · Aluguel' : ' · Venda'}
            ${property.verified ? ' · ✓ Verificado' : ''}
          </div>
          <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;line-height:1.3;">
            ${property.title}
          </div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">
            📍 ${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}/${property.state}
          </div>
          <div style="font-size:16px;font-weight:800;color:${color};margin-bottom:10px;">
            ${formatCurrency(price)}${isRent ? '<span style="font-size:11px;font-weight:400;">/mês</span>' : ''}
          </div>
          <a href="/imoveis/${property.id}" target="_blank"
            style="
              display:block;
              background:${color};
              color:#fff;
              text-align:center;
              padding:8px;
              border-radius:8px;
              text-decoration:none;
              font-size:12px;
              font-weight:700;
            ">
            Ver imóvel →
          </a>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 240,
        className: 'property-popup',
      })

      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Ajusta o zoom para mostrar todos os marcadores
    if (bounds.length === 1) {
      map.setView(bounds[0], 15)
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }

  const withCoords = properties.filter(p => p.latitude && p.longitude)

  return (
    <div className={`relative ${className}`}>
      {/* CSS do Leaflet */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* Mapa */}
      <div
        ref={mapRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: '500px' }}
      />

      {/* Badge de contagem */}
      {withCoords.length < properties.length && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl shadow px-3 py-2 text-xs text-gray-600 z-[400]">
          {withCoords.length} de {properties.length} imóveis no mapa
          {properties.length - withCoords.length > 0 && (
            <span className="text-gray-400 ml-1">
              ({properties.length - withCoords.length} sem localização exata)
            </span>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl shadow p-2.5 z-[400] space-y-1.5 text-xs">
        {[
          { color: '#4338ca', label: 'Venda' },
          { color: '#7c3aed', label: 'Aluguel' },
          { color: '#f59e0b', label: 'Destaque' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div style={{ background: color }} className="w-3 h-3 rounded-full" />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Estilo do popup */}
      <style>{`
        .property-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          padding: 0;
          overflow: hidden;
        }
        .property-popup .leaflet-popup-content {
          margin: 12px;
        }
        .property-popup .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
    </div>
  )
}
