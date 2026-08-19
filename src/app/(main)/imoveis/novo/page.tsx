import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NewPropertyForm from '@/components/imoveis/NewPropertyForm'

export default async function NovoImovelPage() {
  const session = await auth()
  if (!session) redirect('/login?redirect=/imoveis/novo')

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
          <NewPropertyForm userId={session.user?.id ?? ''} />
        </div>
      </main>
      <Footer />
    </>
  )
}
