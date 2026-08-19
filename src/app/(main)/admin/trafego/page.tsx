import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EvolutionChart from '@/components/admin/EvolutionChart'
import { bucketByDay } from '@/lib/analytics'
import { ArrowLeft, BarChart3, Eye, FileText, Link2, TrendingUp } from 'lucide-react'

function referrerHostname(referrer: string) {
  try {
    return new URL(referrer).hostname
  } catch {
    return referrer
  }
}

export default async function TrafegoPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const since30 = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
  since30.setHours(0, 0, 0, 0)
  const since7 = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  since7.setHours(0, 0, 0, 0)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalViews, viewsLast7, viewsToday, viewsLast30Raw, topPages, topReferrers] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: since7 } } }),
    prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
    prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    prisma.pageView.groupBy({
      by: ['referrer'],
      where: { createdAt: { gte: since30 }, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 8,
    }),
  ])

  const viewsEvolution = bucketByDay(viewsLast30Raw, (v) => v.createdAt, 30)
  const maxTopPage = Math.max(1, ...topPages.map((p) => p._count._all))

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tráfego do site</h1>
              <p className="text-sm text-gray-500">Visitas registradas pelo Proxy em páginas públicas</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Visitas hoje', value: viewsToday, icon: Eye, color: 'indigo' },
              { label: 'Últimos 7 dias', value: viewsLast7, icon: TrendingUp, color: 'green' },
              { label: 'Total histórico', value: totalViews, icon: BarChart3, color: 'amber' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                  ${kpi.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : ''}
                  ${kpi.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                  ${kpi.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                `}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpi.value.toLocaleString('pt-BR')}</div>
                <div className="text-xs font-medium text-gray-700 mt-0.5">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Evolução */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Visitas por dia (últimos 30 dias)
            </h2>
            <EvolutionChart data={viewsEvolution} color="bg-indigo-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Páginas mais vistas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" /> Páginas mais vistas (30 dias)
              </h2>
              {topPages.length === 0 ? (
                <p className="text-sm text-gray-400">Ainda sem dados suficientes.</p>
              ) : (
                <div className="space-y-3">
                  {topPages.map((p) => {
                    const pct = Math.round((p._count._all / maxTopPage) * 100)
                    return (
                      <div key={p.path}>
                        <div className="flex items-center justify-between text-sm mb-1 gap-2">
                          <span className="text-gray-700 font-medium truncate" title={p.path}>{p.path}</span>
                          <span className="text-gray-500 flex-shrink-0">{p._count._all}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Origem do tráfego */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-violet-500" /> Origem do tráfego (30 dias)
              </h2>
              {topReferrers.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma origem externa registrada ainda — a maioria das visitas é direta.</p>
              ) : (
                <div className="space-y-3">
                  {topReferrers.map((r) => (
                    <div key={r.referrer} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium truncate" title={r.referrer || ''}>
                        {r.referrer ? referrerHostname(r.referrer) : 'Direto'}
                      </span>
                      <span className="text-gray-500 flex-shrink-0">{r._count._all}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
