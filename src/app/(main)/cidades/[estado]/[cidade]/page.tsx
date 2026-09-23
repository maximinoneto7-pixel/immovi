import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { favoriteIdsFor } from '@/lib/favorites'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PropertyCard from '@/components/imoveis/PropertyCard'
import Link from 'next/link'
import { MapPin, Home, TrendingUp, ChevronRight } from 'lucide-react'
import { formatCurrency, PROPERTY_TYPES } from '@/lib/utils'
import type { Metadata } from 'next'

function cityToSlug(city: string) {
  return city.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}

/** "IVOLÂNDIA" → "Ivolândia"; "SANTO ANTÔNIO DE GOIÁS" → "Santo Antônio de Goiás" */
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
function nomeDaCidade(city: string) {
  return city.toLocaleLowerCase('pt-BR').split(/\s+/)
    .map((w, i) => (i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1)))
    .join(' ')
}

/**
 * O endereço traz a cidade sem acento e em minúsculas (é o que o sitemap publica),
 * enquanto o banco guarda como a pessoa digitou. Procuramos a cidade do estado cujo
 * apelido bate com o do endereço — sem isso, toda cidade com acento caía em 404.
 */
async function acharCidade(uf: string, slug: string) {
  const cidades = await prisma.property.findMany({
    where: { status: 'ACTIVE', state: uf },
    select: { city: true },
    distinct: ['city'],
  })
  return cidades.find((c) => cityToSlug(c.city) === slug)?.city ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ estado: string; cidade: string }> }): Promise<Metadata> {
  const { estado, cidade } = await params
  const uf = estado.toUpperCase()
  const encontrada = await acharCidade(uf, cidade)
  if (!encontrada) return { title: 'Cidade não encontrada | Immovi' }
  const cityName = nomeDaCidade(encontrada)

  return {
    title: `Imóveis em ${cityName}/${uf} — Comprar, Vender e Alugar | Immovi`,
    description: `Encontre casas, apartamentos, terrenos e fazendas em ${cityName}/${uf}. Fale direto com o proprietário, sem comissão obrigatória.`,
    openGraph: {
      title: `Imóveis em ${cityName}/${uf}`,
      description: `Busque imóveis para comprar ou alugar em ${cityName}/${uf} no Immovi.`,
    },
  }
}

export default async function CidadePage({ params }: { params: Promise<{ estado: string; cidade: string }> }) {
  const { estado, cidade } = await params
  const session = await auth()
  const uf = estado.toUpperCase()
  const encontrada = await acharCidade(uf, cidade)
  if (!encontrada) notFound()
  const cityName = nomeDaCidade(encontrada)

  const [properties, stats, types, urbanArea] = await Promise.all([
    prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        state: uf,
        city: encontrada,
      },
      take: 12,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        owner: { select: { id: true, name: true, image: true, verified: true } },
        images: { orderBy: { order: 'asc' } },
        features: true,
      },
    }),
    prisma.property.aggregate({
      where: { status: 'ACTIVE', state: uf, city: encontrada },
      _count: { _all: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.property.groupBy({
      by: ['type'],
      where: { status: 'ACTIVE', state: uf, city: encontrada },
      _count: { _all: true },
      orderBy: { _count: { type: 'desc' } },
      take: 5,
    }),
    // Área média só com urbanos: uma fazenda em hectares distorceria a média da cidade
    prisma.property.aggregate({
      where: { status: 'ACTIVE', state: uf, city: encontrada, type: { not: 'FARM' } },
      _avg: { area: true },
    }),
  ])

  if (stats._count._all === 0) notFound()
  const favoriteIds = await favoriteIdsFor(session?.user?.id, properties.map((p) => p.id))

  const avgPrice = stats._avg.price || 0
  const total = stats._count._all

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero SEO */}
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 text-indigo-300 text-sm mb-3">
              <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/imoveis?state=${uf}`} className="hover:text-white">{uf}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">{cityName}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Imóveis em {cityName}/{uf}
            </h1>
            <p className="text-indigo-100 text-lg mb-6">
              {total} imóvel{total !== 1 ? 's' : ''} disponível{total !== 1 ? 'is' : ''} para compra e aluguel
            </p>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Imóveis', value: total.toString() },
                { label: 'Preço médio', value: avgPrice > 0 ? formatCurrency(avgPrice) : '—' },
                { label: 'A partir de', value: stats._min.price ? formatCurrency(stats._min.price) : '—' },
                { label: 'Área média', value: urbanArea._avg.area ? `${Math.round(urbanArea._avg.area)}m²` : '—' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-indigo-200 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Filtros rápidos por tipo */}
          {types.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Link href={`/imoveis?city=${cityName}&state=${uf}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium">
                Todos ({total})
              </Link>
              {types.map(t => (
                <Link key={t.type}
                  href={`/imoveis?city=${cityName}&state=${uf}&type=${t.type}`}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  {PROPERTY_TYPES[t.type] || t.type} ({t._count._all})
                </Link>
              ))}
            </div>
          )}

          {/* Grid de imóveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p as any} isFavorite={favoriteIds.has(p.id)} />
            ))}
          </div>

          {total > 12 && (
            <div className="text-center mb-10">
              <Link href={`/imoveis?city=${cityName}&state=${uf}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Ver todos os {total} imóveis em {cityName}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Texto SEO */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 prose prose-gray max-w-none">
            <h2>Comprar ou alugar imóvel em {cityName}/{uf}</h2>
            <p>
              O Immovi conecta você diretamente com proprietários e corretores de imóveis em{' '}
              <strong>{cityName}</strong>, no estado de <strong>{uf}</strong>.
              São {total} anúncios com contato direto de casas, apartamentos, terrenos, fazendas e imóveis comerciais.
            </p>
            <p>
              O preço médio dos imóveis em {cityName}/{uf} é de <strong>{avgPrice > 0 ? formatCurrency(avgPrice) : 'não disponível'}</strong>.
              Com a plataforma Immovi, você negocia diretamente com o vendedor,
              sem taxa de intermediação obrigatória, com histórico documentado de todas as conversas.
            </p>
            <h3>Como funciona?</h3>
            <ol>
              <li>Busque imóveis com os filtros desejados (tipo, preço, quartos, área)</li>
              <li>Clique no imóvel para ver fotos, história e dados do proprietário</li>
              <li>Entre em contato diretamente pelo chat seguro da plataforma</li>
              <li>Negocie, agende visita e feche com segurança</li>
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
