import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ReferralPanel from '@/components/common/ReferralPanel'
import { Gift, Users, Crown, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Indique e ganhe | Immovi',
  description: 'Convide alguém para a Immovi e ganhe crédito quando a pessoa anunciar.',
}

export default async function IndicarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/indicar')

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        {/* Hero */}
        <section className="bg-gradient-to-br from-amber-500 to-orange-500 text-white py-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-9 h-9" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Indique e Ganhe!</h1>
            <p className="text-amber-100 text-lg">
              Convide amigos para o Immovi e ganhe <strong className="text-white">1 mês grátis</strong> no
              Plano Destaque para cada indicação que assinar.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Como funciona */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Como funciona
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '1', icon: Gift, title: 'Compartilhe', desc: 'Copie seu link exclusivo e envie para amigos' },
                { step: '2', icon: Users, title: 'Amigo se cadastra', desc: 'Ele cria conta pelo seu link' },
                { step: '3', icon: Crown, title: 'Você ganha', desc: '1 mês grátis no Plano Destaque (R$ 99)' },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="relative inline-block mb-3">
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                      <item.icon className="w-7 h-7 text-amber-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de indicação */}
          <ReferralPanel />

          {/* Regras */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Regras do programa</h3>
            <ul className="space-y-2">
              {[
                'O crédito é concedido quando o indicado assinar qualquer plano pago',
                'Cada crédito equivale a 1 mês grátis no Plano Destaque (R$ 99)',
                'Não há limite de indicações — quanto mais, melhor!',
                'Créditos são aplicados automaticamente na próxima renovação',
                'O programa pode ser encerrado com 30 dias de aviso',
              ].map(r => (
                <li key={r} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
