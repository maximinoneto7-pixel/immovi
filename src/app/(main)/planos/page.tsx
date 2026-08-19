import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PlansClient from '@/components/pagamentos/PlansClient'
import { PLANOS } from '@/lib/stripe'
import { CheckCircle2, Zap, Shield, Building2 } from 'lucide-react'

export default async function PlanosPage() {
  const session = await auth()

  let currentPlan = 'BASIC'
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { planId: true, planExpiresAt: true },
    })
    if (user?.planId && user.planExpiresAt && user.planExpiresAt > new Date()) {
      currentPlan = user.planId
    }
  }

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white py-16 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              Escolha o plano ideal para você
            </div>
            <h1 className="text-4xl font-bold mb-3">Anuncie com mais força</h1>
            <p className="text-indigo-100 text-lg">
              Do anúncio gratuito ao plano completo para imobiliárias. Sem surpresas, cancele quando quiser.
            </p>
          </div>
        </section>

        {/* Cards de planos */}
        <PlansClient plans={PLANOS} currentPlan={currentPlan} isLoggedIn={!!session} />

        {/* Garantias */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, title: 'Garantia de 7 dias', desc: 'Não gostou? Devolvemos 100% do valor sem perguntas.' },
              { icon: CheckCircle2, title: 'Cancele quando quiser', desc: 'Sem fidelidade. Cancele com 1 clique, sem taxa.' },
              { icon: Building2, title: 'Pagamento seguro', desc: 'Processado pelo Asaas com criptografia de ponta — PIX, boleto ou cartão.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <item.icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
