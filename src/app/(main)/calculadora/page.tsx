import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { auth } from '@/lib/auth'
import { Calculator, ArrowRight } from 'lucide-react'

// A calculadora (components/calculadora/CustoCalculator) está suspensa até usar as
// tabelas oficiais de cartório de cada estado e o ITBI de cada município.
export const metadata = {
  title: 'Calculadora de Custos de Compra — Immovi',
  description: 'Em breve: calcule o custo real de comprar um imóvel, com ITBI, escritura e registro.',
  robots: { index: false },
}

export default async function CalculadoraPage() {
  const session = await auth()

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        <section className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Calculator className="w-7 h-7" />
          </div>
          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full tracking-wide">
            Em breve
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calculadora de Custos de Compra</h1>
          <p className="text-gray-500 leading-relaxed">
            Estamos revisando os cálculos de ITBI e cartório com as tabelas oficiais, para que o resultado
            bata com o que você vai pagar.
          </p>
          <Link
            href="/servicos"
            className="mt-2 inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Enquanto isso, conheça os contratos digitais
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
