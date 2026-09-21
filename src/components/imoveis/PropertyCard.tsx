'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Bed, Bath, Car, MapPin, Maximize2, Shield, Star, Scale } from 'lucide-react'
import { formatCurrency, formatArea, formatAlqueires, isRural, mainArea, PROPERTY_TYPES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getCompareIds, toggleCompareId, COMPARE_EVENT, COMPARE_MAX } from '@/lib/compare'

interface PropertyCardProps {
  property: {
    id: string
    title: string
    type: string
    listingType: string
    price: number
    rentPrice?: number | null
    area: number
    builtArea?: number | null
    bedrooms?: number | null
    bathrooms?: number | null
    parkingSpaces?: number | null
    city: string
    state: string
    neighborhood?: string | null
    verified: boolean
    featured: boolean
    owner: {
      name: string
      image?: string | null
      verified: boolean
    }
    images: { url: string; isCover: boolean }[]
  }
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
  className?: string
}

export default function PropertyCard({
  property,
  isFavorite = false,
  onToggleFavorite,
  className,
}: PropertyCardProps) {
  const [isComparing, setIsComparing] = useState(false)

  useEffect(() => {
    const sync = () => setIsComparing(getCompareIds().includes(property.id))
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    return () => window.removeEventListener(COMPARE_EVENT, sync)
  }, [property.id])

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = toggleCompareId(property.id)
    if (!next.includes(property.id) || next.length <= COMPARE_MAX) {
      setIsComparing(next.includes(property.id))
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.(property.id)
  }

  const coverImage = property.images.find((img) => img.isCover) || property.images[0]

  const displayPrice =
    property.listingType === 'RENT'
      ? property.rentPrice
      : property.listingType === 'BOTH'
      ? property.price
      : property.price

  const priceLabel =
    property.listingType === 'RENT'
      ? '/mês'
      : property.listingType === 'BOTH'
      ? ''
      : ''

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group',
        property.featured && 'ring-2 ring-indigo-200',
        className
      )}
    >
      <Link href={`/imoveis/${property.id}`} className="block">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
            <Maximize2 className="w-10 h-10 text-indigo-300" />
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {property.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg shadow">
              <Star className="w-3 h-3 fill-current" />
              Destaque
            </span>
          )}
          <span className="px-2 py-1 bg-white/95 backdrop-blur text-gray-700 text-xs font-semibold rounded-lg shadow">
            {PROPERTY_TYPES[property.type] || property.type}
          </span>
        </div>

        {/* Listing type */}
        <div className="absolute top-3 right-12">
          <span
            className={cn(
              'px-2 py-1 text-xs font-semibold rounded-lg shadow',
              property.listingType === 'SALE'
                ? 'bg-indigo-600 text-white'
                : property.listingType === 'RENT'
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 text-white'
            )}
          >
            {property.listingType === 'SALE'
              ? 'Venda'
              : property.listingType === 'RENT'
              ? 'Aluguel'
              : 'Venda/Aluguel'}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur shadow hover:bg-white transition-colors"
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
            )}
          />
        </button>

        {/* Compare toggle */}
        <button
          onClick={handleToggleCompare}
          className={cn(
            'absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow backdrop-blur transition-colors',
            isComparing ? 'bg-indigo-600 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
          )}
          aria-label={isComparing ? 'Remover do comparador' : 'Adicionar ao comparador'}
        >
          <Scale className="w-3.5 h-3.5" />
          {isComparing ? 'Comparando' : 'Comparar'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(displayPrice || 0)}
          </span>
          {priceLabel && (
            <span className="text-sm text-gray-500 font-normal">{priceLabel}</span>
          )}
          {property.listingType === 'BOTH' && property.rentPrice && (
            <span className="ml-2 text-sm text-green-600 font-medium">
              ou {formatCurrency(property.rentPrice)}/mês
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-2">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}
            {property.city} – {property.state}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-gray-600 pb-3 border-b border-gray-100">
          <span className="flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
            {formatArea(mainArea(property), property.type)}
          </span>
          {isRural(property.type) && (
            <span className="text-gray-500">≈ {formatAlqueires(property.area, true)}</span>
          )}
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-gray-400" />
              {property.bedrooms} qts
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-gray-400" />
              {property.bathrooms} ban
            </span>
          )}
          {property.parkingSpaces != null && property.parkingSpaces > 0 && (
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-gray-400" />
              {property.parkingSpaces}
            </span>
          )}
        </div>

        {/* Owner */}
        <div className="pt-3 flex items-center gap-2">
          {property.owner.image ? (
            <img
              src={property.owner.image}
              alt={property.owner.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 text-xs font-semibold">
                {property.owner.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-700 truncate">
                {property.owner.name}
              </span>
              {(property.owner.verified || property.verified) && (
                <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-gray-400">Proprietário</span>
          </div>
        </div>
      </div>
      </Link>
    </div>
  )
}
