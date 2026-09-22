import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listingLimitError } from '@/lib/subscription'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NewPropertyForm from '@/components/imoveis/NewPropertyForm'
import { AlertCircle } from 'lucide-react'

export default async function NovoImovelPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/imoveis/novo')

  // Avisa do limite do plano antes de a pessoa preencher tudo
  const limitError = await listingLimitError(session.user.id)

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Anunciar imóvel</h1>
            <p className="text-gray-500 mt-1">
              Preencha as informações do seu imóvel. Quanto mais detalhes, mais chances de encontrar o comprador ideal.
            </p>
          </div>
          {limitError ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Você atingiu o limite de anúncios ativos</h2>
              <p className="text-sm text-gray-500 max-w-md">{limitError.replace(' em /planos', '')}</p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Link href="/planos" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  Ver planos
                </Link>
                <Link href="/perfil#meus-anuncios" className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Meus anúncios
                </Link>
              </div>
            </div>
          ) : (
            <NewPropertyForm userId={session.user.id} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
