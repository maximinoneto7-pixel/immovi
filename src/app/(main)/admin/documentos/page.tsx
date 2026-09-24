import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import DocumentReview from '@/components/admin/DocumentReview'
import { ArrowLeft, FileText, ShieldCheck, Clock } from 'lucide-react'
import { formatArea, formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Conferir matrículas | Immovi',
}

// Fila de matrículas enviadas pelos anunciantes, para a equipe conferir à mão
// enquanto a leitura por IA não está ligada.
export default async function AdminDocumentosPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const [naFila, recentes] = await Promise.all([
    prisma.propertyDocument.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
      orderBy: { createdAt: 'asc' },
      include: {
        property: {
          select: {
            id: true, title: true, city: true, state: true, area: true, type: true, verified: true,
            owner: { select: { name: true, email: true, cpf: true, verified: true } },
          },
        },
      },
    }),
    prisma.propertyDocument.findMany({
      where: { status: { in: ['VERIFIED', 'MISMATCH'] }, reviewedAt: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      take: 10,
      include: { property: { select: { id: true, title: true } } },
    }),
  ])

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conferir matrículas</h1>
              <p className="text-sm text-gray-500">
                {naFila.length === 0
                  ? 'Nenhum documento aguardando.'
                  : `${naFila.length} documento${naFila.length > 1 ? 's' : ''} aguardando conferência.`}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-900">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              O que conferir
            </div>
            <p className="text-indigo-800 leading-relaxed">
              O nome do proprietário na matrícula precisa ser o mesmo do anunciante, e o imóvel da matrícula
              precisa ser o do anúncio. Aprovando, o selo de anúncio verificado aparece na hora. Em qualquer
              caso, o arquivo é apagado assim que você decide.
            </p>
          </div>

          {naFila.length > 0 && (
            <div className="space-y-3">
              {naFila.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[14rem]">
                      <Link href={`/imoveis/${doc.property.id}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                        {doc.property.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {doc.property.city} – {doc.property.state} · {formatArea(doc.property.area, doc.property.type)}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      enviado em {formatDate(doc.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div>
                      <span className="text-gray-500">Anunciante: </span>
                      <span className="font-medium text-gray-900">{doc.property.owner.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">CPF cadastrado: </span>
                      <span className="font-medium text-gray-900">{doc.property.owner.cpf || 'não informado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">E-mail: </span>
                      <span className="font-medium text-gray-900">{doc.property.owner.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Arquivo: </span>
                      <span className="font-medium text-gray-900">{doc.originalName || 'sem nome'}</span>
                    </div>
                  </div>

                  <DocumentReview
                    documentId={doc.id}
                    fileUrl={doc.fileUrl}
                    ownerName={doc.property.owner.name}
                  />
                </div>
              ))}
            </div>
          )}

          {naFila.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Fila vazia</p>
              <p className="text-sm text-gray-500 mt-1">
                Quando um anunciante enviar a matrícula do imóvel, ela aparece aqui.
              </p>
            </div>
          )}

          {recentes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Conferidos recentemente</h2>
              <ul className="divide-y divide-gray-100 text-sm">
                {recentes.map((doc) => (
                  <li key={doc.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/imoveis/${doc.property.id}`} className="flex-1 min-w-[12rem] text-gray-800 hover:text-indigo-600">
                      {doc.property.title}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {doc.status === 'VERIFIED' ? 'aprovado' : 'recusado'}
                    </span>
                    <span className="text-xs text-gray-400">{doc.reviewedAt ? formatDate(doc.reviewedAt) : ''}</span>
                    {doc.reviewNote && <span className="w-full text-xs text-gray-500">Motivo: {doc.reviewNote}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
