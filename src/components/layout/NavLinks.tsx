'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Search, Shield, Crown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const navLinks = [
  { href: '/imoveis', label: 'Buscar Imóveis', icon: Search },
  { href: '/imoveis?listingType=RENT', label: 'Alugar', icon: Home },
  { href: '/avaliar', label: 'Avaliar Imóvel', icon: TrendingUp },
  { href: '/servicos', label: 'Serviços', icon: Shield },
  { href: '/planos', label: 'Planos', icon: Crown },
]

interface NavLinksProps {
  variant?: 'desktop' | 'mobile'
  onLinkClick?: () => void
}

export default function NavLinks({ variant = 'desktop', onLinkClick }: NavLinksProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isRentFilter = searchParams.get('listingType') === 'RENT'

  function isActive(href: string) {
    if (href === '/imoveis') return pathname === '/imoveis' && !isRentFilter
    if (href === '/imoveis?listingType=RENT') return pathname === '/imoveis' && isRentFilter
    return pathname === href
  }

  if (variant === 'mobile') {
    return (
      <>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
              isActive(link.href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </>
    )
  }

  return (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive(link.href)
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <link.icon className="w-4 h-4" />
          {link.label}
        </Link>
      ))}
    </>
  )
}
