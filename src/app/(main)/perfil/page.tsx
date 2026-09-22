import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MyListings from '@/components/perfil/MyListings'
import { Shield, Star, Home, PlusCircle, Edit, Phone, Mail, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/perfil')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      // Todas as situações, menos os excluídos: pausados e vendidos continuam na sua lista
      properties: {
        where: { status: { not: 'DELETED' } },
        select: {
          id: true, title: true, status: true, listingType: true, price: true, rentPrice: true, views: true,
          images: { orderBy: { order: 'asc' }, select: { url: true, isCover: true } },
          _count: { select: { conversations: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      reviewsReceived: {
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          properties: { where: { status: { not: 'DELETED' } } },
          favorites: true,
          reviewsReceived: true,
        },
      },
    },
  })

  if (!user) redirect('/')

  const avgRating = user.reviewsReceived.length
    ? user.reviewsReceived.reduce((a, r) => a + r.rating, 0) / user.reviewsReceived.length
    : 0

  const roleLabels: Record<string, string> = {
    BUYER: 'Comprador',
    SELLER: 'Vendedor',
    AGENT: 'Corretor',
    ADMIN: 'Admin',
  }

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-700" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 -mt-10 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative -mt-16 sm:-mt-20">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow" />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-indigo-100 flex items-center justify-center border-4 border-white shadow">
                    <span className="text-4xl font-bold text-indigo-700">{user.name.charAt(0)}</span>
                  </div>
                )}
                {user.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-2 sm:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                        {roleLabels[user.role] || user.role}
                      </span>
                      {user.verified && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          <Shield className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/perfil/editar"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar perfil
                  </Link>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Membro desde {new Date(user.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {user.bio && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.properties}</div>
                <div className="text-xs text-gray-500">Anúncios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  {avgRating > 0 && <Star className="w-5 h-5 text-amber-400 fill-current" />}
                </div>
                <div className="text-xs text-gray-500">{user._count.reviewsReceived} avaliações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.favorites}</div>
                <div className="text-xs text-gray-500">Favoritos</div>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div id="meus-anuncios" className="mb-6 scroll-mt-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-500" />
                Meus anúncios ({user.properties.length})
              </h2>
              <Link
                href="/imoveis/novo"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Novo anúncio
              </Link>
            </div>

            {user.properties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-gray-500 text-sm mb-4">Você ainda não tem anúncios publicados.</p>
                <Link href="/imoveis/novo" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Anunciar primeiro imóvel
                </Link>
              </div>
            ) : (
              <MyListings
                listings={user.properties.map((p) => ({
                  id: p.id,
                  title: p.title,
                  status: p.status,
                  listingType: p.listingType,
                  price: p.price,
                  rentPrice: p.rentPrice,
                  views: p.views,
                  conversations: p._count.conversations,
                  coverUrl: (p.images.find((i) => i.isCover) ?? p.images[0])?.url ?? null,
                }))}
              />
            )}
          </div>

          {/* Reviews */}
          {user.reviewsReceived.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-current" />
                Avaliações recebidas
              </h2>
              <div className="space-y-4">
                {user.reviewsReceived.map((r) => (
                  <div key={r.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      {r.reviewer.image ? (
                        <img src={r.reviewer.image} alt={r.reviewer.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-700">{r.reviewer.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{r.reviewer.name}</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
