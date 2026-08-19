import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CustoCalculator from '@/components/calculadora/CustoCalculator'
import { auth } from '@/lib/auth'
import { Calculator, Info, Shield, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Calculadora de Custos de Compra — Immovi',
  description: 'Calcule o custo real de comprar um imóvel no Brasil: ITBI, escritura, registro, corretor e financiamento.',
}

export default async function CalculadoraPage() {
  const session = await auth()

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold">Calculadora de Custos de Compra</h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl">
              Descubra o <strong className="text-white">custo real</strong> de comprar um imóvel.
              Além do preço, há impostos, cartório e taxas que podem somar até 8% do valor.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { icon: Shield, text: 'ITBI por município' },
                { icon: TrendingUp, text: 'Financiamento + FGTS' },
                { icon: Calculator, text: 'Custo total detalhado' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                  <Icon className="w-3.5 h-3.5 text-indigo-300" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Aviso legal */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Valores estimados.</strong> As alíquotas de ITBI variam por município e as taxas de
              cartório seguem tabelas estaduais atualizadas anualmente. Consulte sempre um profissional
              jurídico para valores exatos antes de fechar negócio.
            </p>
          </div>
        </div>

        {/* Calculadora */}
        <div className="max-w-4xl mx-auto px-4 py-6 pb-16">
          <CustoCalculator />
        </div>
      </main>
      <Footer />
    </>
  )
}
