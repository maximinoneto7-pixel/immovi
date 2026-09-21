import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { TrendingUp, MapPin, Home, BarChart2, ArrowRight } from 'lucide-react'
import { formatCurrency, PROPERTY_TYPES } from '@/lib/utils'

export const metadata = {
  title: 'Relatório de Mercado Imobiliário | Immovi',
  description: 'Preço médio do m², tendências e estatísticas do mercado imobiliário por cidade e estado.',
}

export default async function MercadoPage() {
  const session = await auth()

  const [byCity, byType, byState, totals, urbanTotals, urbanAreaByCity] = await Promise.all([
    // Top 10 cidades por volume
    prisma.property.groupBy({
      by: ['city', 'state'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10,
    }),
    // Por tipo de imóvel
    prisma.property.groupBy({
      by: ['type'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
      _avg: { price: true, area: true },
      orderBy: { _count: { type: 'desc' } },
    }),
    // Por estado
    prisma.property.groupBy({
      by: ['state'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
      _avg: { price: true },
      orderBy: { _count: { state: 'desc' } },
      take: 10,
    }),
    // Totais gerais
    prisma.property.aggregate({
      where: { status: 'ACTIVE' },
      _count: { _all: true },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    }),
    // Área média e preço/m² só com urbanos: uma fazenda de 500 ha (5 milhões de m²) distorceria tudo
    prisma.property.aggregate({
      where: { status: 'ACTIVE', type: { not: 'FARM' } },
      _avg: { price: true, area: true },
    }),
    prisma.property.groupBy({
      by: ['city', 'state'],
      where: { status: 'ACTIVE', type: { not: 'FARM' } },
      _avg: { area: true },
    }),
  ])

  const pricePerM2 = (urbanTotals._avg.price || 0) / (urbanTotals._avg.area || 1)
  const urbanAreaOf = new Map(urbanAreaByCity.map((c) => [`${c.city}|${c.state}`, c._avg.area]))

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-indigo-300" />
              <h1 className="text-3xl font-bold">Relatório de Mercado</h1>
            </div>
            <p className="text-gray-300 text-lg">
              Estatísticas reais do mercado imobiliário brasileiro, geradas a partir dos anúncios ativos na plataforma.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* KPIs gerais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Imóveis ativos', value: totals._count._all.toLocaleString('pt-BR'), icon: Home },
              { label: 'Preço médio', value: formatCurrency(totals._avg.price || 0), icon: TrendingUp },
              { label: 'Preço médio m²', value: formatCurrency(pricePerM2), icon: BarChart2 },
              { label: 'Área média', value: `${Math.round(urbanTotals._avg.area || 0)} m²`, icon: MapPin },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <Icon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Por cidade */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Cidades com mais imóveis
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Cidade</th>
                    <th className="text-right px-4 py-3">Imóveis</th>
                    <th className="text-right px-4 py-3">Preço médio</th>
                    <th className="text-right px-4 py-3">Área média</th>
                    <th className="text-right px-4 py-3">A partir de</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byCity.map((c, i) => (
                    <tr key={`${c.city}-${c.state}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{c.city}</div>
                            <div className="text-xs text-gray-400">{c.state}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{c._count._all}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{c._avg.price ? formatCurrency(c._avg.price) : '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{urbanAreaOf.get(`${c.city}|${c.state}`) ? `${Math.round(urbanAreaOf.get(`${c.city}|${c.state}`)!)}m²` : '—'}</td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">{c._min.price ? formatCurrency(c._min.price) : '—'}</td>
                      <td className="px-4 py-3">
                        <Link href={`/imoveis?city=${c.city}&state=${c.state}`}
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-0.5">
                          Ver <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Por tipo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-green-500" /> Por tipo de imóvel
            </h2>
            <div className="space-y-3">
              {byType.map(t => {
                const pct = Math.round((t._count._all / (totals._count._all || 1)) * 100)
                return (
                  <div key={t.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{PROPERTY_TYPES[t.type] || t.type}</span>
                        <span className="text-xs text-gray-400">({t._count._all} imóveis)</span>
                      </div>
                      <span className="font-semibold text-gray-700">
                        {t._avg.price ? formatCurrency(t._avg.price) : '—'} médio
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Por estado */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-500" /> Por estado
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {byState.map(s => (
                <Link key={s.state} href={`/imoveis?state=${s.state}`}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all text-center">
                  <div className="text-xl font-bold text-gray-900">{s.state}</div>
                  <div className="text-xs text-gray-500">{s._count._all} imóveis</div>
                  <div className="text-xs text-indigo-600 font-medium mt-1">
                    {s._avg.price ? formatCurrency(s._avg.price) : '—'}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Dados baseados nos anúncios ativos na plataforma. Atualizado em tempo real.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
