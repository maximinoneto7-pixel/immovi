import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AlertsManager from '@/components/imoveis/AlertsManager'
import PushNotificationToggle from '@/components/common/PushNotificationToggle'
import { Bell, Plus, Search } from 'lucide-react'

export default async function AlertasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/alertas')

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-indigo-500" />
                Meus Alertas
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Receba e-mail quando aparecer imóvel que combina com sua busca
              </p>
            </div>
            <Link href="/imoveis"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <Search className="w-4 h-4" />
              Nova busca
            </Link>
          </div>

          <PushNotificationToggle />

          {searches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nenhum alerta criado ainda</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Faça uma busca com os filtros desejados e clique em "Criar alerta"
                para ser notificado por e-mail quando novos imóveis aparecerem.
              </p>
              <Link href="/imoveis"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                <Search className="w-4 h-4" />
                Buscar imóveis
              </Link>
            </div>
          ) : (
            <AlertsManager initialSearches={searches.map(s => ({
              ...s,
              filters: JSON.parse(s.filters),
              lastNotifiedAt: s.lastNotifiedAt?.toISOString() ?? null,
              createdAt: s.createdAt.toISOString(),
            }))} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
