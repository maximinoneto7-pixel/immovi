import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AcoesDoErro from '@/components/admin/AcoesDoErro'
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Erros | Immovi' }

function quando(data: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(data)
}

// O que quebrou no site. Antes isso só existia como e-mail, e e-mail se perde:
// o mesmo erro avisava uma vez e as repetições sumiam sem deixar rastro.
export default async function AdminErrosPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const [abertos, resolvidos] = await Promise.all([
    prisma.erroRegistrado.findMany({
      where: { resolvidoEm: null },
      orderBy: { ultimaEm: 'desc' },
      take: 50,
    }),
    prisma.erroRegistrado.findMany({
      where: { resolvidoEm: { not: null } },
      orderBy: { ultimaEm: 'desc' },
      take: 20,
    }),
  ])

  const Cartao = ({ erro, resolvido }: { erro: (typeof abertos)[number]; resolvido: boolean }) => (
    <article className={`bg-white rounded-2xl border shadow-sm p-5 ${resolvido ? 'border-gray-100 opacity-70' : 'border-amber-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {erro.onde}
            </span>
            {erro.vezes > 1 && (
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                {erro.vezes}×
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 mt-2 break-words">{erro.mensagem}</p>
          <p className="text-xs text-gray-400 mt-1">
            última vez em {quando(erro.ultimaEm)} · primeira em {quando(erro.primeiraEm)}
          </p>
        </div>
        <AcoesDoErro id={erro.id} resolvido={resolvido} />
      </div>

      {erro.detalhes && (
        <pre className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3 overflow-x-auto">
          {erro.detalhes}
        </pre>
      )}

      {erro.pilha && (
        <details className="mt-3">
          <summary className="text-xs font-medium text-indigo-600 cursor-pointer hover:underline">
            Onde quebrou
          </summary>
          <pre className="mt-2 text-[11px] leading-relaxed text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3 overflow-x-auto">
            {erro.pilha}
          </pre>
        </details>
      )}
    </article>
  )

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Erros</h1>
              <p className="text-sm text-gray-500">O que quebrou para alguém usando o site</p>
            </div>
          </div>

          {abertos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Nada quebrado por aqui</p>
              <p className="text-sm text-gray-500 mt-1">
                Quando alguma coisa falhar, aparece aqui com o motivo e onde aconteceu.
              </p>
            </div>
          ) : (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-bold text-gray-900">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Em aberto ({abertos.length})
              </h2>
              {abertos.map((erro) => <Cartao key={erro.id} erro={erro} resolvido={false} />)}
            </section>
          )}

          {resolvidos.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-gray-900">Resolvidos</h2>
              <p className="text-sm text-gray-500 -mt-1">
                Se voltarem a acontecer, saem daqui e voltam para a lista de cima sozinhos.
              </p>
              {resolvidos.map((erro) => <Cartao key={erro.id} erro={erro} resolvido />)}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
