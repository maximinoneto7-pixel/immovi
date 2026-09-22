'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Share2, Check } from 'lucide-react'
import { toggleFavorite } from '@/app/actions/property'
import CompareToggleButton from '@/components/imoveis/CompareToggleButton'
import { cn } from '@/lib/utils'

interface ListingActionsProps {
  propertyId: string
  title: string
  isFavorited: boolean
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Sem permissão para a área de transferência: cópia pelo método antigo
    const field = document.createElement('textarea')
    field.value = text
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const ok = document.execCommand('copy')
    field.remove()
    return ok
  }
}

export default function ListingActions({ propertyId, title, isFavorited }: ListingActionsProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(isFavorited)
  const [copied, setCopied] = useState(false)

  const handleFavorite = async () => {
    const before = favorited
    setFavorited(!before)
    const result = await toggleFavorite(propertyId)
    if ('error' in result) {
      setFavorited(before)
      if (result.error === 'Não autenticado.') router.push(`/login?redirect=/imoveis/${propertyId}`)
      return
    }
    setFavorited(result.favorited)
  }

  // Celular: menu de compartilhar do sistema. Computador: copia o link
  // (no Windows o navigator.share abriria a janela do sistema em vez de copiar)
  const handleShare = async () => {
    const url = window.location.href
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }
    if (await copyText(url)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleFavorite}
          aria-pressed={favorited}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Heart className={cn('w-4 h-4', favorited && 'fill-red-500 text-red-500')} />
          {favorited ? 'Favoritado' : 'Favoritar'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Link copiado' : 'Compartilhar'}
        </button>
        <CompareToggleButton propertyId={propertyId} />
      </div>
    </div>
  )
}
