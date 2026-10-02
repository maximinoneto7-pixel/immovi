import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EvolutionChart from '@/components/admin/EvolutionChart'
import { bucketByDay } from '@/lib/analytics'
import { hasActivePaidPlan } from '@/lib/subscription'
import { rankDe } from '@/lib/ranking'
import { ArrowLeft, Eye, Heart, MessageCircle, CalendarDays, Handshake, Lock, Link2 } from 'lucide-react'

export const metadata = { title: 'Desempenho do anúncio | Immovi' }

/** O relatório é benefício dos planos Profissional e Imobiliária */
const RANK_MINIMO = 2

function hostDe(referrer: string) {
  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return referrer
  }
}

export default async function DesempenhoPage(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?redirect=/imoveis/${id}/desempenho`)

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true, title: true, ownerId: true, views: true, city: true, state: true, createdAt: true,
      _count: { select: { favorites: true, conversations: true } },
    },
  })
  if (!property) notFound()

  const ehAdmin = session.user.role === 'ADMIN'
  if (property.ownerId !== session.user.id && !ehAdmin) notFound()

  const dono = await prisma.user.findUnique({
    where: { id: property.ownerId },
    select: { planId: true, planExpiresAt: true, role: true },
  })
  const liberado = ehAdmin || rankDe(dono) >= RANK_MINIMO

  if (!liberado) {
    return (
      <>
        <Header user={session.user as any} />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-16">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Relatório de desempenho</h1>
              <p className="text-sm text-gray-600 mb-6">
                Quantas pessoas viram o anúncio a cada dia, de onde elas vieram e quantas chegaram a
                conversar, agendar visita ou fazer proposta. Faz parte dos planos Profissional e Imobiliária.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/planos" className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
                  Ver planos
                </Link>
                <Link href={`/imoveis/${id}`} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Voltar ao anúncio
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const caminho = `/imoveis/${id}`
  const desde = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
  desde.setHours(0, 0, 0, 0)

  const [visitasDaPagina, origens, visitas, propostas] = await Promise.all([
    prisma.pageView.findMany({ where: { path: caminho, createdAt: { gte: desde } }, select: { createdAt: true } }),
    prisma.pageView.groupBy({
      by: ['referrer'],
      where: { path: caminho, createdAt: { gte: desde }, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 6,
    }),
    prisma.visit.count({ where: { propertyId: id } }),
    prisma.offer.count({ where: { propertyId: id } }),
  ])

  const porDia = bucketByDay(visitasDaPagina, (v) => v.createdAt, 30)
  const noPeriodo = visitasDaPagina.length

  const kpis = [
    { label: 'Visualizações', valor: property.views, sub: `${noPeriodo} nos últimos 30 dias`, icon: Eye, cor: 'text-indigo-600 bg-indigo-50' },
    { label: 'Favoritos', valor: property._count.favorites, sub: 'pessoas que salvaram', icon: Heart, cor: 'text-rose-600 bg-rose-50' },
    { label: 'Conversas', valor: property._count.conversations, sub: 'quem chamou no chat', icon: MessageCircle, cor: 'text-violet-600 bg-violet-50' },
    { label: 'Visitas', valor: visitas, sub: 'pedidos de visita', icon: CalendarDays, cor: 'text-emerald-600 bg-emerald-50' },
    { label: 'Propostas', valor: propostas, sub: 'ofertas recebidas', icon: Handshake, cor: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-start gap-3">
            <Link href={`/imoveis/${id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{property.title}</h1>
              <p className="text-sm text-gray-500">
                {property.city}/{property.state} · no ar desde {property.createdAt.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${k.cor}`}>
                  <k.icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{k.valor.toLocaleString('pt-BR')}</div>
                <div className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" /> Visualizações por dia (30 dias)
            </h2>
            <EvolutionChart data={porDia} color="bg-indigo-500" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-500" /> De onde vieram
            </h2>
            {origens.length === 0 ? (
              <p className="text-sm text-gray-400">
                Ninguém chegou por link de fora ainda — as visitas vieram da busca do próprio site ou de
                acesso direto.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50 text-sm">
                {origens.map((o) => (
                  <li key={o.referrer} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-gray-700 truncate">{hostDe(o.referrer!)}</span>
                    <span className="text-gray-500 font-medium flex-shrink-0">{o._count._all}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-gray-400">
            As visualizações por dia são contadas a partir do registro de páginas, guardado por 90 dias.
            O total do primeiro quadro é desde a publicação do anúncio.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
