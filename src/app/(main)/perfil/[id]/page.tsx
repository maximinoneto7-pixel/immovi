import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/imoveis/PropertyCard'
import { Shield, Star, Home, MapPin, Calendar, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (session?.user?.id === id) redirect('/perfil')

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      properties: {
        where: { status: 'ACTIVE' },
        include: {
          owner: { select: { id: true, name: true, image: true, verified: true } },
          images: { orderBy: { order: 'asc' } },
          features: true,
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
          properties: { where: { status: 'ACTIVE' } },
          reviewsReceived: true,
        },
      },
    },
  })

  if (!user) notFound()

  const avgRating = user.reviewsReceived.length
    ? user.reviewsReceived.reduce((a, r) => a + r.rating, 0) / user.reviewsReceived.length
    : 0

  const roleLabels: Record<string, string> = {
    BUYER: 'Comprador',
    SELLER: 'Vendedor',
    AGENT: 'Corretor',
    ADMIN: 'Admin',
  }

  const isAgent = user.role === 'AGENT'

  return (
    <>
      <Header user={session?.user as any} />
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
                  {isAgent && user.creci && (
                    <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                      CRECI {user.creci}{user.creciState ? `/${user.creciState}` : ''}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  {(user.city || user.state) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {user.city ? `${user.city}${user.state ? ', ' : ''}` : ''}{user.state || ''}
                    </span>
                  )}
                  {isAgent && user.agencyName && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {user.agencyName}
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
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.properties}</div>
                <div className="text-xs text-gray-500">Anúncios ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  {avgRating > 0 && <Star className="w-5 h-5 text-amber-400 fill-current" />}
                </div>
                <div className="text-xs text-gray-500">{user._count.reviewsReceived} avaliações</div>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-indigo-500" />
              Anúncios de {user.name.split(' ')[0]} ({user.properties.length})
            </h2>

            {user.properties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-gray-500 text-sm">Nenhum anúncio ativo no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {user.properties.map((p) => (
                  <PropertyCard key={p.id} property={p as any} />
                ))}
              </div>
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

          {!isAgent && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Por segurança, contate {user.name.split(' ')[0]} apenas pelo chat de um anúncio específico.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
