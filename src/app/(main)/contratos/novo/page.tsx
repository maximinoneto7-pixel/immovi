import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLANOS, formatPrice } from '@/lib/stripe'
import { canCreateContracts } from '@/lib/subscription'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NewContractForm from '@/components/contratos/NewContractForm'
import { FileText, Lock, CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Novo contrato — Immovi' }

const MODELOS = ['Promessa de Compra e Venda', 'Contrato de Locação', 'Contrato de Permuta', 'Cessão de Direitos']

export default async function NovoContratoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/contratos/novo')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true, planExpiresAt: true, role: true },
  })

  if (canCreateContracts(user)) {
    return <NewContractForm user={session.user as any} />
  }

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50">
        <section className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
          <div className="relative w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-7 h-7" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contratos digitais são exclusivos para assinantes</h1>
          <p className="text-gray-500 leading-relaxed">
            Com qualquer plano pago você gera contratos completos, com várias partes de cada lado, prontos para imprimir e assinar.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left my-2">
            {MODELOS.map((m) => (
              <li key={m} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {m}
              </li>
            ))}
          </ul>
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Ver planos a partir de {formatPrice(PLANOS.DESTAQUE.preco)}/mês
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/contratos" className="text-sm text-gray-500 hover:text-indigo-600">
            Ver meus contratos
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
