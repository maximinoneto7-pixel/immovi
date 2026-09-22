'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, Pencil, Pause, Play, Loader2, AlertCircle } from 'lucide-react'
import { setPropertyStatus } from '@/app/actions/property'
import { cn, formatCurrency, PROPERTY_STATUS } from '@/lib/utils'

export interface MyListing {
  id: string
  title: string
  status: string
  listingType: string
  price: number
  rentPrice: number | null
  views: number
  conversations: number
  coverUrl: string | null
}

const STATUS_PILL: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  SOLD: 'bg-indigo-100 text-indigo-700',
  RENTED: 'bg-indigo-100 text-indigo-700',
}

export default function MyListings({ listings }: { listings: MyListing[] }) {
  return (
    <div className="space-y-2">
      {listings.map((listing) => <ListingRow key={listing.id} listing={listing} />)}
    </div>
  )
}

function ListingRow({ listing }: { listing: MyListing }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const isActive = listing.status === 'ACTIVE'

  const toggle = () => {
    setError('')
    startTransition(async () => {
      const result = await setPropertyStatus(listing.id, isActive ? 'INACTIVE' : 'ACTIVE')
      if ('error' in result) setError(result.error ?? 'Não foi possível alterar o anúncio.')
      else router.refresh()
    })
  }

  const price = listing.listingType === 'RENT'
    ? `${formatCurrency(listing.rentPrice || listing.price)}/mês`
    : formatCurrency(listing.price)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
      <div className="flex items-center gap-3">
        <Link href={`/imoveis/${listing.id}`} className="flex-shrink-0">
          {listing.coverUrl ? (
            <img
              src={listing.coverUrl}
              alt=""
              className={cn('w-20 h-14 rounded-xl object-cover', !isActive && 'grayscale-[60%]')}
            />
          ) : (
            <div className="w-20 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Home className="w-5 h-5 text-indigo-300" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/imoveis/${listing.id}`} className="font-semibold text-sm text-gray-900 hover:text-indigo-600 line-clamp-1">
            {listing.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500">
            <span className={cn('px-2 py-0.5 font-bold rounded-full', STATUS_PILL[listing.status] || 'bg-gray-100 text-gray-600')}>
              {PROPERTY_STATUS[listing.status] || listing.status}
            </span>
            <span>{price}</span>
            <span>· {listing.views} {listing.views === 1 ? 'visita' : 'visitas'}</span>
            <span>· {listing.conversations} {listing.conversations === 1 ? 'conversa' : 'conversas'}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link
            href={`/imoveis/${listing.id}/editar`}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Editar</span>
          </Link>
          <button
            onClick={toggle}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isActive ? 'Pausar' : 'Reativar'}</span>
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {error.replace(' em /planos.', '.')}
            {error.includes('/planos') && <> <Link href="/planos" className="font-semibold underline">Ver planos</Link></>}
          </span>
        </div>
      )}
    </div>
  )
}
