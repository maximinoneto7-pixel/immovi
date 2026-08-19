import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import {
  CreditCard, TrendingUp, Users, Zap, CheckCircle2,
  XCircle, Clock, ArrowUpRight, Rocket, Crown,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { formatPrice, PLANOS } from '@/lib/stripe'
import CancelSubscriptionButton from '@/components/pagamentos/CancelSubscriptionButton'

export default async function PagamentosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/pagamentos')

  const isAdmin = session.user.role === 'ADMIN'

  // Dados do usuário atual
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true, planExpiresAt: true, role: true },
  })

  const mySubscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const myBoosts = await prisma.propertyBoost.findMany({
    where: { userId: session.user.id },
    include: { property: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Admin vê totais gerais
  let adminStats = null
  let allSubscriptions: any[] = []
  if (isAdmin) {
    const [totalSubs, activeSubs, totalBoosts, revenue] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.propertyBoost.count(),
      prisma.subscription.aggregate({ _sum: { amountPaid: true } }),
    ])
    adminStats = { totalSubs, activeSubs, totalBoosts, revenue: revenue._sum.amountPaid || 0 }

    allSubscriptions = await prisma.subscription.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  const currentPlan = user?.planId && user.planExpiresAt && user.planExpiresAt > new Date()
    ? user.planId
    : 'BASIC'

  const latestSubscription = mySubscriptions[0]
  const hasActiveRenewal = latestSubscription?.status === 'ACTIVE'
  const isCanceledButStillValid = latestSubscription?.status === 'CANCELED'
    && user?.planExpiresAt && user.planExpiresAt > new Date()

  const planInfo = PLANOS[currentPlan as keyof typeof PLANOS]

  const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ACTIVE:    { label: 'Ativo', color: 'text-green-700 bg-green-50', icon: CheckCircle2 },
    CANCELED:  { label: 'Cancelado', color: 'text-red-600 bg-red-50', icon: XCircle },
    EXPIRED:   { label: 'Expirado', color: 'text-gray-500 bg-gray-100', icon: Clock },
    PENDING:   { label: 'Pendente', color: 'text-amber-600 bg-amber-50', icon: Clock },
  }

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAdmin ? 'Dashboard de Pagamentos' : 'Meu Plano e Pagamentos'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {isAdmin ? 'Visão geral de todas as assinaturas e receitas' : 'Gerencie seu plano e histórico de pagamentos'}
              </p>
            </div>
            <Link
              href="/planos"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Crown className="w-4 h-4" />
              {currentPlan === 'BASIC' ? 'Fazer upgrade' : 'Mudar plano'}
            </Link>
          </div>

          {/* Cards de resumo (Admin) */}
          {isAdmin && adminStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total assinaturas', value: adminStats.totalSubs, icon: Users, color: 'blue' },
                { label: 'Assinaturas ativas', value: adminStats.activeSubs, icon: CheckCircle2, color: 'green' },
                { label: 'Foguetes vendidos', value: adminStats.totalBoosts, icon: Rocket, color: 'amber' },
                { label: 'Receita total', value: formatPrice(adminStats.revenue * 100), icon: TrendingUp, color: 'violet' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                    ${stat.color === 'blue' ? 'bg-indigo-100 text-indigo-600' : ''}
                    ${stat.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                    ${stat.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                    ${stat.color === 'violet' ? 'bg-violet-100 text-violet-600' : ''}
                  `}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plano atual */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                Plano atual
              </h2>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{planInfo?.nome || 'Básico'}</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">
                  {planInfo?.preco ? formatPrice(planInfo.preco) : 'Grátis'}
                  {planInfo?.preco ? <span className="text-sm font-normal text-gray-400">/mês</span> : ''}
                </div>
                {user?.planExpiresAt && currentPlan !== 'BASIC' && (
                  <div className="text-xs text-gray-400 mt-2">
                    {isCanceledButStillValid
                      ? <span className="text-amber-600 font-medium">Cancelado — ativo até {formatDate(user.planExpiresAt)}</span>
                      : `Renova em ${formatDate(user.planExpiresAt)}`}
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                {planInfo?.recursos.slice(0, 4).map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {r}
                  </div>
                ))}
              </div>

              {!isAdmin && currentPlan !== 'BASIC' && hasActiveRenewal && (
                <CancelSubscriptionButton />
              )}

              {currentPlan === 'BASIC' && (
                <Link href="/planos" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                  Fazer upgrade
                </Link>
              )}
            </div>

            {/* Histórico de assinaturas */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                {isAdmin ? 'Todas as assinaturas' : 'Histórico de pagamentos'}
              </h2>

              {(isAdmin ? allSubscriptions : mySubscriptions).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum pagamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(isAdmin ? allSubscriptions : mySubscriptions).map((sub: any) => {
                    const s = STATUS_LABELS[sub.status] || STATUS_LABELS.PENDING
                    const SIcon = s.icon
                    return (
                      <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Crown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900">
                            Plano {sub.plan}
                            {isAdmin && sub.user && (
                              <span className="font-normal text-gray-500"> — {sub.user.name}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(sub.createdAt)} → {formatDate(sub.expiresAt)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-900 text-sm">{formatPrice(sub.amountPaid * 100)}</div>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${s.color}`}>
                            <SIcon className="w-3 h-3" />
                            {s.label}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Foguetes */}
          {myBoosts.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-500" />
                Foguetes utilizados
              </h2>
              <div className="space-y-3">
                {myBoosts.map((boost) => {
                  const active = boost.status === 'ACTIVE' && boost.expiresAt > new Date()
                  return (
                    <div key={boost.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-amber-100' : 'bg-gray-100'}`}>
                        <Rocket className={`w-5 h-5 ${active ? 'text-amber-500' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{boost.property.title}</div>
                        <div className="text-xs text-gray-400">{boost.boostType.replace('_', ' ')} — até {formatDate(boost.expiresAt)}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-sm text-gray-900">{formatPrice(boost.amountPaid * 100)}</div>
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${active ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? '🚀 Ativo' : 'Expirado'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
