import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatCurrency, formatArea, isRural, mainArea, M2_PER_HECTARE, PROPERTY_TYPES, LISTING_TYPES } from '@/lib/utils'
import { Scale, Shield, Star, CheckCircle2, XCircle, MapPin } from 'lucide-react'

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsParam } = await searchParams
  const session = await auth()

  const requestedIds = (idsParam || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4)

  const properties = requestedIds.length >= 2
    ? await prisma.property.findMany({
        // Pausados e excluídos não entram no comparador
        where: { id: { in: requestedIds }, status: { in: ['ACTIVE', 'SOLD', 'RENTED'] } },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          features: true,
          owner: { select: { name: true, verified: true } },
        },
      })
    : []

  // Preserva a ordem em que o usuário selecionou
  const ordered = requestedIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const allFeatures = Array.from(new Set(ordered.flatMap((p) => p.features.map((f) => f.name))))

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <Scale className="w-4 h-4" />
            Comparador de imóveis
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Comparar imóveis</h1>

          {ordered.length < 2 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Selecione pelo menos 2 imóveis</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Navegue pelos anúncios e clique em <strong>"Comparar"</strong> no card de cada imóvel
                (até {4}) para ver a comparação lado a lado aqui.
              </p>
              <Link href="/imoveis" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                Buscar imóveis
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-4 w-40 text-xs font-semibold text-gray-400 uppercase tracking-wide">Imóvel</th>
                      {ordered.map((p) => {
                        const cover = p.images[0]
                        const price = p.listingType === 'RENT' ? (p.rentPrice || p.price) : p.price
                        return (
                          <th key={p.id} className="p-4 text-left min-w-[220px] align-top">
                            <Link href={`/imoveis/${p.id}`} className="block group">
                              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-2">
                                {cover ? (
                                  <img src={cover.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Scale className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600">
                                {p.title}
                              </div>
                            </Link>
                            <div className="text-lg font-bold text-indigo-600 mt-1">{formatCurrency(price)}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {p.city} – {p.state}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { label: 'Tipo', render: (p: typeof ordered[number]) => PROPERTY_TYPES[p.type] || p.type },
                      { label: 'Finalidade', render: (p: typeof ordered[number]) => LISTING_TYPES[p.listingType] || p.listingType },
                      { label: 'Área', render: (p: typeof ordered[number]) => formatArea(p.area, p.type) },
                      { label: 'Área construída', render: (p: typeof ordered[number]) => p.builtArea ? formatArea(p.builtArea) : '—' },
                      {
                        // Rural compara por hectare; casa, pela área construída
                        label: 'Preço por área',
                        render: (p: typeof ordered[number]) => {
                          const value = p.listingType === 'RENT' ? (p.rentPrice || p.price) : p.price
                          return isRural(p.type)
                            ? `${formatCurrency(value / (p.area / M2_PER_HECTARE))}/ha`
                            : `${formatCurrency(value / mainArea(p))}/m²`
                        },
                      },
                      { label: 'Quartos', render: (p: typeof ordered[number]) => p.bedrooms ?? '—' },
                      { label: 'Banheiros', render: (p: typeof ordered[number]) => p.bathrooms ?? '—' },
                      { label: 'Vagas', render: (p: typeof ordered[number]) => p.parkingSpaces ?? '—' },
                      { label: 'Condomínio', render: (p: typeof ordered[number]) => p.condoFee ? formatCurrency(p.condoFee) + '/mês' : '—' },
                      { label: 'IPTU', render: (p: typeof ordered[number]) => p.iptu ? formatCurrency(p.iptu) + '/mês' : '—' },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{row.label}</td>
                        {ordered.map((p) => (
                          <td key={p.id} className="p-4 text-gray-700 font-medium">{row.render(p)}</td>
                        ))}
                      </tr>
                    ))}

                    <tr>
                      <td className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Mobiliado</td>
                      {ordered.map((p) => (
                        <td key={p.id}>
                          {p.furnished
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-4" />
                            : <XCircle className="w-4 h-4 text-gray-300 mx-4" />}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Aceita pets</td>
                      {ordered.map((p) => (
                        <td key={p.id}>
                          {p.acceptsPets
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-4" />
                            : <XCircle className="w-4 h-4 text-gray-300 mx-4" />}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Verificado</td>
                      {ordered.map((p) => (
                        <td key={p.id}>
                          {p.verified
                            ? <span className="inline-flex items-center gap-1 text-indigo-600 text-xs font-semibold"><Shield className="w-3.5 h-3.5" /> Sim</span>
                            : <span className="text-gray-400 text-xs">Não</span>}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Anunciante</td>
                      {ordered.map((p) => (
                        <td key={p.id} className="p-4 text-gray-700">
                          <div className="flex items-center gap-1">
                            {p.owner.name}
                            {p.owner.verified && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {allFeatures.length > 0 && (
                      <tr>
                        <td colSpan={ordered.length + 1} className="p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Características
                        </td>
                      </tr>
                    )}
                    {allFeatures.map((feature) => (
                      <tr key={feature}>
                        <td className="p-4 text-sm text-gray-600">{feature}</td>
                        {ordered.map((p) => (
                          <td key={p.id}>
                            {p.features.some((f) => f.name === feature)
                              ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-4" />
                              : <XCircle className="w-4 h-4 text-gray-300 mx-4" />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
