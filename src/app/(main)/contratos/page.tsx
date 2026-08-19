import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { FileText, Plus, Eye, Download, Clock, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CONTRACT_TYPES: Record<string, string> = {
  PROMESSA_COMPRA_VENDA: 'Promessa de Compra e Venda',
  LOCACAO: 'Contrato de Locação',
  PERMUTA: 'Contrato de Permuta',
  CESSAO: 'Cessão de Direitos',
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SIGNED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-600',
}

export default async function ContratosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/contratos')

  const contracts = await prisma.contract.findMany({
    where: { userId: session.user.id },
    include: { property: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
              <p className="text-gray-500 text-sm mt-1">
                Gere e gerencie seus contratos imobiliários com validade jurídica
              </p>
            </div>
            <Link
              href="/contratos/novo"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo contrato
            </Link>
          </div>

          {/* Templates disponíveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { type: 'PROMESSA_COMPRA_VENDA', icon: '📄', desc: 'Para venda de imóveis com sinal e prazo', color: 'blue' },
              { type: 'LOCACAO', icon: '🔑', desc: 'Para locação residencial ou comercial', color: 'green' },
              { type: 'PERMUTA', icon: '🔄', desc: 'Para troca de imóveis entre partes', color: 'violet' },
              { type: 'CESSAO', icon: '📋', desc: 'Para cessão de direitos sobre imóvel', color: 'amber' },
            ].map((t) => (
              <Link
                key={t.type}
                href={`/contratos/novo?type=${t.type}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <div className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                  {CONTRACT_TYPES[t.type]}
                </div>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </Link>
            ))}
          </div>

          {/* Lista de contratos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Meus contratos ({contracts.length})
              </h2>
            </div>

            {contracts.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-gray-500">Nenhum contrato ainda</p>
                <p className="text-xs mt-1">Clique em "Novo contrato" para começar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {contracts.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{c.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {CONTRACT_TYPES[c.type] || c.type}
                        {c.property && ` — ${c.property.title}`}
                        {' · '}{formatDate(c.createdAt)}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status] || STATUS_STYLE.DRAFT}`}>
                      {c.status === 'DRAFT' ? 'Rascunho' : c.status === 'SIGNED' ? 'Assinado' : 'Cancelado'}
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/contratos/${c.id}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/contratos/${c.id}/imprimir`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
