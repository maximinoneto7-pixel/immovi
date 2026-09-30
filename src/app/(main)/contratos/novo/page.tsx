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

/**
 * Preenchimento a partir da proposta aceita. Só quem participou da conversa vê os dados,
 * e o vendedor é sempre o dono do anúncio.
 */
async function dadosDaProposta(propostaId: string, userId: string) {
  const proposta = await prisma.offer.findUnique({
    where: { id: propostaId },
    include: {
      property: { select: { title: true, address: true, city: true, state: true, description: true, ownerId: true } },
      from: { select: { id: true, name: true, cpf: true } },
      to: { select: { id: true, name: true, cpf: true } },
      conversation: { select: { participants: { select: { userId: true } } } },
    },
  })
  if (!proposta || proposta.status !== 'ACCEPTED') return null
  if (!proposta.conversation.participants.some((p) => p.userId === userId)) return null

  const donoId = proposta.property?.ownerId
  const vendedor = proposta.from.id === donoId ? proposta.from : proposta.to
  const comprador = proposta.from.id === donoId ? proposta.to : proposta.from

  return {
    titulo: proposta.property ? `Promessa de Compra e Venda — ${proposta.property.title}` : '',
    vendedor: { nome: vendedor.name, cpf: vendedor.cpf || '' },
    comprador: { nome: comprador.name, cpf: comprador.cpf || '' },
    imovel: {
      endereco: proposta.property?.address || '',
      cidade: proposta.property?.city || '',
      estado: proposta.property?.state || '',
      descricao: proposta.property?.description?.slice(0, 500) || '',
    },
    valor: String(Math.round(proposta.amount)),
  }
}

export default async function NovoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ proposta?: string; type?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/contratos/novo')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true, planExpiresAt: true, role: true },
  })

  if (canCreateContracts(user)) {
    // Vindo de uma proposta aceita, o contrato já nasce com as partes, o imóvel e o valor
    const { proposta: propostaId } = await searchParams
    const preenchido = propostaId ? await dadosDaProposta(propostaId, session.user.id) : null
    return <NewContractForm user={session.user as any} preenchido={preenchido} />
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
