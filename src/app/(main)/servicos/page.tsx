import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLANOS, formatPrice } from '@/lib/stripe'
import { canCreateContracts } from '@/lib/subscription'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import {
  FileText, KeyRound, Repeat, ArrowLeftRight, Landmark, Calculator,
  Wrench, Shield, Scale, TrendingUp, ArrowRight, Lock,
} from 'lucide-react'

export const metadata = {
  title: 'Contratos imobiliários digitais — Immovi',
  description: 'Promessa de compra e venda, locação, permuta e cessão de direitos: contratos completos, prontos para imprimir e assinar.',
}

const MODELOS = [
  { type: 'PROMESSA_COMPRA_VENDA', icon: FileText, title: 'Promessa de Compra e Venda', desc: 'Venda com sinal e prazo para a escritura' },
  { type: 'LOCACAO', icon: KeyRound, title: 'Contrato de Locação', desc: 'Residencial ou comercial, pela Lei do Inquilinato (8.245/91)' },
  { type: 'PERMUTA', icon: Repeat, title: 'Contrato de Permuta', desc: 'Troca de imóveis entre as partes, com ou sem torna' },
  { type: 'CESSAO', icon: ArrowLeftRight, title: 'Cessão de Direitos', desc: 'Transferência de direitos sobre um imóvel' },
]

const PASSOS = ['Escolha o modelo', 'Preencha partes, imóvel e pagamento', 'Revise e salve em PDF para assinar']

const EM_BREVE = [
  { icon: Landmark, title: 'Simulação de Financiamento' },
  { icon: Calculator, title: 'Calculadora de Custos' },
  { icon: Wrench, title: 'Vistoria Profissional' },
  { icon: Shield, title: 'Seguro Imobiliário' },
  { icon: Scale, title: 'Assessoria Jurídica' },
  { icon: TrendingUp, title: 'Avaliação de Imóvel' },
]

export default async function ServicosPage() {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { planId: true, planExpiresAt: true, role: true },
      })
    : null
  const canCreate = canCreateContracts(user)

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1">
        {/* Hero — contratos */}
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-16">
          <div className="max-w-3xl mx-auto px-4 text-center flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Contratos imobiliários
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Seu contrato imobiliário pronto em minutos</h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Modelos completos de compra e venda, locação, permuta e cessão de direitos. Preencha, revise e imprima para assinar.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {canCreate ? (
                <>
                  <Link href="/contratos/novo" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-colors">
                    Criar contrato <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/contratos" className="px-6 py-3 border border-white/30 hover:bg-white/10 rounded-xl font-semibold text-sm transition-colors">
                    Meus contratos
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/planos" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-colors">
                    Assinar e criar contratos <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="#modelos" className="px-6 py-3 border border-white/30 hover:bg-white/10 rounded-xl font-semibold text-sm transition-colors">
                    Ver modelos
                  </a>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {canCreate
                ? 'Incluso no seu plano · Várias partes de cada lado · PDF para impressão'
                : `Incluso em todos os planos pagos, a partir de ${formatPrice(PLANOS.DESTAQUE.preco)}/mês · Várias partes de cada lado · PDF para impressão`}
            </p>
          </div>
        </section>

        {/* Modelos */}
        <section id="modelos" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Escolha o modelo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MODELOS.map((m) => (
              <Link
                key={m.type}
                href={`/contratos/novo?type=${m.type}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <m.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">{m.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{m.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                  {canCreate ? (
                    <>Começar <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
                  ) : (
                    <><Lock className="w-3.5 h-3.5" /> Para assinantes</>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Como funciona</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PASSOS.map((passo, i) => (
                <li key={passo} className="flex items-center gap-3">
                  <span className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">{passo}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Em breve */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Outros serviços, em breve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EM_BREVE.map((s) => (
              <div key={s.title} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 bg-white text-gray-500">
                <s.icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="text-sm flex-1">{s.title}</span>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">Em breve</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
