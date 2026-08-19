import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { FileText, Printer, ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CONTRACT_TYPES: Record<string, string> = {
  PROMESSA_COMPRA_VENDA: 'Promessa de Compra e Venda',
  LOCACAO: 'Contrato de Locação',
  PERMUTA: 'Contrato de Permuta',
  CESSAO: 'Cessão de Direitos',
}

export default async function ContratoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const contract = await prisma.contract.findFirst({
    where: { id, userId: session.user.id },
    include: { property: { select: { id: true, title: true } } },
  })

  if (!contract) notFound()

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/contratos" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{contract.title}</h1>
                <p className="text-sm text-gray-500">
                  {CONTRACT_TYPES[contract.type] || contract.type} • {formatDate(contract.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                contract.status === 'SIGNED' ? 'bg-green-100 text-green-700' :
                contract.status === 'CANCELED' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {contract.status === 'SIGNED'
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Assinado</>
                  : <><Clock className="w-3.5 h-3.5" /> Rascunho</>
                }
              </div>
              <Link
                href={`/contratos/${id}/imprimir`}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </Link>
            </div>
          </div>

          {/* Conteúdo do contrato */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div
              className="contract-content"
              dangerouslySetInnerHTML={{ __html: contract.content }}
            />
          </div>

          {/* Partes */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contract.sellerName && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vendedor</div>
                <div className="font-semibold text-gray-900">{contract.sellerName}</div>
                {contract.sellerCpf && <div className="text-sm text-gray-500">CPF: {contract.sellerCpf}</div>}
              </div>
            )}
            {contract.buyerName && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Comprador</div>
                <div className="font-semibold text-gray-900">{contract.buyerName}</div>
                {contract.buyerCpf && <div className="text-sm text-gray-500">CPF: {contract.buyerCpf}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
