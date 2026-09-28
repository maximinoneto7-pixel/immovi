import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ReportActions from '@/components/admin/ReportActions'
import { MOTIVOS } from '@/app/api/denuncias/route'
import { ArrowLeft, Flag, ShieldAlert } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Denúncias | Immovi',
}

const ACAO_LABEL: Record<string, string> = {
  REMOVER_ANUNCIO: 'anúncio removido',
  SUSPENDER_CONTA: 'conta suspensa',
  ARQUIVAR: 'arquivada',
}

// Denúncias de anúncio. O que sai do ar sai por decisão registrada aqui.
export default async function AdminDenunciasPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const [abertas, resolvidas] = await Promise.all([
    prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      include: {
        property: {
          select: {
            id: true, title: true, city: true, state: true, status: true, verified: true,
            owner: { select: { id: true, name: true, email: true, suspendedAt: true } },
          },
        },
      },
    }),
    prisma.report.findMany({
      where: { status: { not: 'OPEN' } },
      orderBy: { handledAt: 'desc' },
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
              <h1 className="text-2xl font-bold text-gray-900">Denúncias</h1>
              <p className="text-sm text-gray-500">
                {abertas.length === 0
                  ? 'Nenhuma denúncia aguardando.'
                  : `${abertas.length} denúncia${abertas.length > 1 ? 's' : ''} para analisar.`}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Por que responder rápido importa
            </div>
            <p className="text-amber-800 leading-relaxed">
              A plataforma não responde pelo conteúdo que o anunciante publica, desde que aja quando é avisada.
              Cada decisão tomada aqui fica registrada com data, motivo e autor — é essa a prova de diligência.
            </p>
          </div>

          {abertas.length > 0 && (
            <div className="space-y-3">
              {abertas.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[14rem]">
                      <Link href={`/imoveis/${d.property.id}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                        {d.property.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {d.property.city} – {d.property.state} · anunciante: {d.property.owner.name} ({d.property.owner.email})
                        {d.property.owner.suspendedAt && ' · conta já suspensa'}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      <Flag className="w-3.5 h-3.5" />
                      {MOTIVOS[d.reason] || d.reason}
                    </span>
                  </div>

                  {d.details && (
                    <blockquote className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border-l-4 border-gray-200 italic">
                      “{d.details}”
                    </blockquote>
                  )}

                  <div className="text-xs text-gray-400">
                    Denunciado em {formatDate(d.createdAt)}
                    {d.reporterId ? ' por um usuário identificado' : ' por um visitante'}
                    {d.reporterIp ? ` · IP ${d.reporterIp}` : ''}
                  </div>

                  <ReportActions reportId={d.id} />
                </div>
              ))}
            </div>
          )}

          {abertas.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Nenhuma denúncia em aberto</p>
              <p className="text-sm text-gray-500 mt-1">
                Quando alguém denunciar um anúncio, ela aparece aqui e você recebe um e-mail na hora.
              </p>
            </div>
          )}

          {resolvidas.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Decisões recentes</h2>
              <ul className="divide-y divide-gray-100 text-sm">
                {resolvidas.map((d) => (
                  <li key={d.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/imoveis/${d.property.id}`} className="flex-1 min-w-[12rem] text-gray-800 hover:text-indigo-600">
                      {d.property.title}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      d.actionTaken === 'ARQUIVAR' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                    }`}>
                      {ACAO_LABEL[d.actionTaken || ''] || d.status}
                    </span>
                    <span className="text-xs text-gray-400">{d.handledAt ? formatDate(d.handledAt) : ''}</span>
                    {d.handleNote && <span className="w-full text-xs text-gray-500">Motivo: {d.handleNote}</span>}
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
