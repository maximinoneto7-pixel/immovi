import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ValuationForm from '@/components/avaliar/ValuationForm'
import { auth } from '@/lib/auth'
import { TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Quanto vale meu imóvel? | Immovi',
  description: 'Descubra em segundos uma estimativa de valor do seu imóvel, com base em anúncios reais da sua região.',
}

export default async function AvaliarPage() {
  const session = await auth()

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-14">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-indigo-200" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Quanto vale o seu imóvel?</h1>
            <p className="text-indigo-100">
              Preencha os dados abaixo e receba uma estimativa instantânea baseada em anúncios reais da sua região.
            </p>
          </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-10">
          <ValuationForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
