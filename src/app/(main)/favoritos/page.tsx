import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/imoveis/PropertyCard'
import { Heart, Home } from 'lucide-react'

export default async function FavoritosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/favoritos')

  const favorites = await prisma.favorite.findMany({
    // Pausados e excluídos saem da lista; vendidos e alugados aparecem com a etiqueta
    where: { userId: session.user.id, property: { status: { in: ['ACTIVE', 'SOLD', 'RENTED'] } } },
    include: {
      property: {
        include: {
          owner: { select: { id: true, name: true, image: true, verified: true } },
          images: { orderBy: { order: 'asc' } },
          features: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
              Imóveis Favoritos
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {favorites.length} imóvel{favorites.length !== 1 ? 's' : ''} salvo{favorites.length !== 1 ? 's' : ''}
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nenhum favorito ainda</h3>
              <p className="text-gray-500 text-sm mb-6">
                Salve imóveis que você gostou para acompanhar depois.
              </p>
              <Link
                href="/imoveis"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Explorar imóveis
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {favorites.map((fav) => (
                <PropertyCard key={fav.id} property={fav.property as any} isFavorite={true} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
