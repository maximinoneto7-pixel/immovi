'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import {
  Heart, MessageCircle, User, Menu, X,
  PlusCircle, LogOut, Shield, ChevronDown, CreditCard,
  FileText, Rocket, BadgeCheck, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import NavLinks from './NavLinks'
import Logo from '@/components/common/Logo'

interface HeaderProps {
  user?: {
    id: string
    name: string
    email: string
    image?: string | null
    role?: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // Conversas com mensagem nova — recarrega a cada troca de página
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let alive = true
    fetch('/api/mensagens/nao-lidas', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setUnread(d.count) })
      .catch(() => {})
    return () => { alive = false }
  }, [userId, pathname])

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" aria-label="Immovi — página inicial" className="flex-shrink-0">
            <Logo size="sm" wordmarkClassName="hidden sm:block" />
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Suspense fallback={null}>
              <NavLinks />
            </Suspense>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/imoveis/novo"
                  className={cn(
                    'hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/imoveis/novo'
                      ? 'bg-indigo-700 text-white ring-2 ring-indigo-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  )}
                >
                  <PlusCircle className="w-4 h-4" />
                  Anunciar
                </Link>

                <Link
                  href="/favoritos"
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    pathname === '/favoritos'
                      ? 'bg-red-50 text-red-500'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <Heart className="w-5 h-5" />
                </Link>

                <Link
                  href="/mensagens"
                  aria-label={unread > 0 ? `Mensagens: ${unread} conversa(s) com mensagem nova` : 'Mensagens'}
                  className={cn(
                    'relative p-2 rounded-lg transition-colors',
                    pathname.startsWith('/mensagens')
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <MessageCircle className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-700 text-sm font-semibold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold"
                        >
                          <Shield className="w-4 h-4" />
                          Painel Admin
                        </Link>
                      )}
                      <Link
                        href="/perfil"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                      <Link
                        href="/alertas"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Bell className="w-4 h-4 text-indigo-500" />
                        Meus Alertas
                      </Link>
                      <Link
                        href="/imoveis/novo"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Anunciar Imóvel
                      </Link>
                      {(user.role === 'SELLER' || user.role === 'AGENT' || user.role === 'ADMIN') && (
                        <Link
                          href="/documentos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                        >
                          <BadgeCheck className="w-4 h-4 text-green-500" />
                          Verificar Documentos
                        </Link>
                      )}
                      <Link
                        href="/contratos"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4" />
                        Contratos
                      </Link>
                      <Link
                        href="/pagamentos"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        Plano e Pagamentos
                      </Link>
                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            href="/admin/asaas"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="text-base leading-none">🏦</span>
                            Configurar Asaas
                          </Link>
                          <Link
                            href="/admin/stripe"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <CreditCard className="w-4 h-4 text-green-500" />
                            Configurar Stripe
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 mt-1">
                        <form action="/api/auth/signout" method="POST">
                          <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Sair
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Cadastrar
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Suspense fallback={null}>
            <NavLinks variant="mobile" onLinkClick={() => setMenuOpen(false)} />
          </Suspense>
          {user && (
            <>
              <Link
                href="/imoveis/novo"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium',
                  pathname === '/imoveis/novo'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-indigo-600 hover:bg-indigo-50'
                )}
              >
                <PlusCircle className="w-4 h-4" />
                Anunciar Imóvel
              </Link>
              {(user.role === 'SELLER' || user.role === 'AGENT' || user.role === 'ADMIN') && (
                <Link
                  href="/documentos"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50"
                >
                  <BadgeCheck className="w-4 h-4" />
                  Verificar Documentos
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  )
}
