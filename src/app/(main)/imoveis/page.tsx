import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { favoriteIdsFor } from '@/lib/favorites'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/imoveis/PropertyCard'
import FiltersPanel from '@/components/imoveis/FiltersPanel'
import MapToggle from '@/components/imoveis/MapToggle'
import SaveSearchButton from '@/components/imoveis/SaveSearchButton'
import CompareBar from '@/components/imoveis/CompareBar'
import { SlidersHorizontal, Search, MapPin } from 'lucide-react'
import { PROPERTY_TYPES, STATES } from '@/lib/utils'

interface SearchParams extends Record<string, string | undefined> {
  q?: string
  type?: string
  listingType?: string
  city?: string
  state?: string
  minPrice?: string
  maxPrice?: string
  minArea?: string
  maxArea?: string
  bedrooms?: string
  page?: string
  featured?: string
}

async function getProperties(params: SearchParams) {
  const page = parseInt(params.page || '1')
  const pageSize = 12
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = { status: 'ACTIVE' }

  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { description: { contains: params.q } },
      { city: { contains: params.q } },
      { neighborhood: { contains: params.q } },
      { address: { contains: params.q } },
    ]
  }
  if (params.type) where.type = params.type
  if (params.listingType) where.listingType = params.listingType
  if (params.city) where.city = { contains: params.city }
  if (params.state) where.state = params.state
  if (params.featured === 'true') where.featured = true
  if (params.minPrice || params.maxPrice) {
    where.price = {}
    if (params.minPrice) (where.price as Record<string, number>).gte = parseFloat(params.minPrice)
    if (params.maxPrice) (where.price as Record<string, number>).lte = parseFloat(params.maxPrice)
  }
  if (params.minArea || params.maxArea) {
    where.area = {}
    if (params.minArea) (where.area as Record<string, number>).gte = parseFloat(params.minArea)
    if (params.maxArea) (where.area as Record<string, number>).lte = parseFloat(params.maxArea)
  }
  if (params.bedrooms) where.bedrooms = { gte: parseInt(params.bedrooms) }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        owner: { select: { id: true, name: true, image: true, verified: true } },
        images: { orderBy: { order: 'asc' } },
        features: true,
      },
    }),
    prisma.property.count({ where }),
  ])

  return { properties, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await auth()
  const { properties, total, page, totalPages } = await getProperties(params)
  const favoriteIds = await favoriteIdsFor(session?.user?.id, properties.map((p) => p.id))

  const hasFilters = params.q || params.type || params.listingType || params.city || params.state || params.minPrice || params.maxPrice || params.bedrooms

  return (
    <>
      <Header user={session?.user as any} />

      <main className="flex-1">
        {/* Search header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <form action="/imoveis" method="GET" className="flex-1">
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q}
                    placeholder="Cidade, bairro, endereço..."
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </form>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
                  <span className="font-semibold text-gray-900">{total.toLocaleString('pt-BR')}</span> imóvel{total !== 1 ? 's' : ''}
                </span>
                <SaveSearchButton filters={params} isLoggedIn={!!session} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <FiltersPanel currentParams={params} />
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Active filters summary */}
              {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                  <span className="text-gray-500">Filtros:</span>
                  {params.q && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      "{params.q}"
                    </span>
                  )}
                  {params.type && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      {PROPERTY_TYPES[params.type] || params.type}
                    </span>
                  )}
                  {params.listingType && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      {params.listingType === 'SALE' ? 'Venda' : 'Aluguel'}
                    </span>
                  )}
                  {params.state && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      <MapPin className="w-3 h-3" /> {params.state}
                    </span>
                  )}
                  <a href="/imoveis" className="text-red-500 text-xs hover:text-red-700 underline ml-1">
                    Limpar tudo
                  </a>
                </div>
              )}

              {/* Toggle Grid / Mapa */}
              {properties.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{total}</span> imóvel{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                  </span>
                  <MapToggle properties={properties as any} />
                </div>
              )}

              {properties.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum imóvel encontrado</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                    Tente ajustar os filtros ou buscar por outra cidade ou tipo de imóvel.
                  </p>
                  <a href="/imoveis"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Ver todos os imóveis
                  </a>
                </div>
              ) : (
                <>
                  <div id="grid-view" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property as any} isFavorite={favoriteIds.has(property.id)} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      {page > 1 && (
                        <a
                          href={`/imoveis?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Anterior
                        </a>
                      )}
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1
                        return (
                          <a
                            key={p}
                            href={`/imoveis?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              p === page
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </a>
                        )
                      })}
                      {page < totalPages && (
                        <a
                          href={`/imoveis?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Próximo
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <CompareBar />
      <Footer />
    </>
  )
}
