import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EvolutionChart from '@/components/admin/EvolutionChart'
import { bucketByDay } from '@/lib/analytics'
import {
  Users, Home, MessageCircle, TrendingUp, Shield,
  Eye, UserCheck, AlertTriangle, Crown, Rocket,
  ArrowUpRight, Calendar, MapPin, Settings, Database, BarChart3,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const [
    totalUsers, newUsersThisWeek, totalProperties, activeProperties,
    totalMessages, totalConversations, totalSubscriptions, revenueData,
    recentUsers, recentProperties, pendingReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.message.count(),
    prisma.conversation.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.aggregate({ _sum: { amountPaid: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, role: true, verified: true, createdAt: true, creci: true },
    }),
    prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        owner: { select: { name: true, email: true } },
        images: { take: 1 },
      },
    }),
    0, // placeholder para denúncias futuras
  ])

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { _all: true },
  })

  const propertiesByType = await prisma.property.groupBy({
    by: ['type'],
    where: { status: 'ACTIVE' },
    _count: { _all: true },
    orderBy: { _count: { type: 'desc' } },
  })

  const TYPE_LABELS: Record<string, string> = {
    HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno',
    FARM: 'Fazenda', COMMERCIAL: 'Comercial', OTHER: 'Outro',
  }
  const ROLE_LABELS: Record<string, string> = {
    BUYER: 'Compradores', SELLER: 'Vendedores', AGENT: 'Corretores', ADMIN: 'Admins',
  }

  const revenue = revenueData._sum.amountPaid || 0

  const since14 = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
  since14.setHours(0, 0, 0, 0)

  const [newUsersRaw, newPropertiesRaw, revenueRaw] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
    prisma.property.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
    prisma.subscription.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true, amountPaid: true } }),
  ])

  const usersEvolution = bucketByDay(newUsersRaw, (u) => u.createdAt, 14)
  const propertiesEvolution = bucketByDay(newPropertiesRaw, (p) => p.createdAt, 14)
  const revenueEvolution = bucketByDay(revenueRaw, (s) => s.createdAt, 14, (s) => s.amountPaid)

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
                <Shield className="w-4 h-4" />
                Painel Administrativo
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/usuarios" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Users className="w-4 h-4" /> Usuários
              </Link>
              <Link href="/admin/anuncios" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Home className="w-4 h-4" /> Anúncios
              </Link>
              <Link href="/admin/conversas" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Conversas
              </Link>
              <Link href="/admin/trafego" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Tráfego
              </Link>
            </div>
          </div>

          {/* KPIs principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total de Usuários', value: totalUsers, sub: `+${newUsersThisWeek} esta semana`, icon: Users, color: 'blue', href: '/admin/usuarios' },
              { label: 'Imóveis Ativos', value: activeProperties, sub: `${totalProperties} total`, icon: Home, color: 'green', href: '/admin/anuncios' },
              { label: 'Mensagens Trocadas', value: totalMessages.toLocaleString('pt-BR'), sub: `${totalConversations} conversas`, icon: MessageCircle, color: 'violet', href: '/admin/conversas' },
              { label: 'Receita Total', value: formatCurrency(revenue), sub: `${totalSubscriptions} assinaturas ativas`, icon: TrendingUp, color: 'amber', href: '/pagamentos' },
            ].map((kpi) => (
              <Link key={kpi.label} href={kpi.href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                  ${kpi.color === 'blue' ? 'bg-indigo-100 text-indigo-600' : ''}
                  ${kpi.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                  ${kpi.color === 'violet' ? 'bg-violet-100 text-violet-600' : ''}
                  ${kpi.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                `}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{kpi.value}</div>
                <div className="text-xs font-medium text-gray-700 mt-0.5">{kpi.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
              </Link>
            ))}
          </div>

          {/* Evolução (últimos 14 dias) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Novos usuários (14 dias)
              </h2>
              <EvolutionChart data={usersEvolution} color="bg-indigo-500" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-green-500" /> Novos anúncios (14 dias)
              </h2>
              <EvolutionChart data={propertiesEvolution} color="bg-green-500" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Receita (14 dias)
              </h2>
              <EvolutionChart data={revenueEvolution} color="bg-amber-500" formatValue={formatCurrency} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Usuários por perfil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Usuários por perfil
              </h2>
              <div className="space-y-3">
                {usersByRole.map((r) => {
                  const pct = Math.round((r._count._all / totalUsers) * 100)
                  return (
                    <div key={r.role}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{ROLE_LABELS[r.role] || r.role}</span>
                        <span className="text-gray-500">{r._count._all} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Imóveis por tipo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-green-500" /> Anúncios por tipo
              </h2>
              <div className="space-y-3">
                {propertiesByType.map((t) => {
                  const pct = Math.round((t._count._all / activeProperties) * 100)
                  return (
                    <div key={t.type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{TYPE_LABELS[t.type] || t.type}</span>
                        <span className="text-gray-500">{t._count._all} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Acesso rápido */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Ações rápidas</h2>
              <div className="space-y-2">
                {[
                  { href: '/admin/usuarios', icon: UserCheck, label: 'Verificar usuários pendentes', color: 'blue' },
                  { href: '/admin/anuncios', icon: Eye, label: 'Moderar anúncios', color: 'green' },
                  { href: '/admin/conversas', icon: MessageCircle, label: 'Monitorar conversas', color: 'violet' },
                  { href: '/pagamentos', icon: Crown, label: 'Ver pagamentos', color: 'amber' },
                  { href: '/admin/trafego', icon: BarChart3, label: 'Ver tráfego do site', color: 'teal' },
                  { href: '/admin/sistema', icon: Settings, label: 'Sistema e backups', color: 'teal' },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${item.color === 'blue' ? 'bg-indigo-100 text-indigo-600' : ''}
                      ${item.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                      ${item.color === 'violet' ? 'bg-violet-100 text-violet-600' : ''}
                      ${item.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                      ${item.color === 'teal' ? 'bg-teal-100 text-teal-600' : ''}
                    `}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Usuários recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Usuários recentes
                </h2>
                <Link href="/admin/usuarios" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Ver todos <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 text-sm font-bold">{u.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">{u.name}</span>
                        {u.verified && <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                        {u.creci && <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">CRECI</span>}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs font-semibold text-gray-600">{ROLE_LABELS[u.role] || u.role}</div>
                      <div className="text-xs text-gray-400">{formatDate(u.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anúncios recentes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-green-500" /> Anúncios recentes
                </h2>
                <Link href="/admin/anuncios" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Ver todos <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentProperties.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    {p.images[0] ? (
                      <img src={p.images[0].url} alt={p.title} className="w-12 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Home className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/imoveis/${p.id}`} className="text-sm font-semibold text-gray-900 truncate block hover:text-indigo-600">
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" /> {p.city}, {p.state}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{p.status === 'ACTIVE' ? 'Ativo' : p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
