import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CreciVerifier from '@/components/admin/CreciVerifier'
import { Shield, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function AdminCreciPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: {
      id: true, name: true, email: true, creci: true,
      creciState: true, agencyName: true, verified: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const verified = agents.filter(a => a.verified).length
  const pending = agents.filter(a => !a.verified).length

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Verificação de CRECI
              </h1>
              <p className="text-sm text-gray-500">
                {verified} verificados · {pending} pendentes
              </p>
            </div>
          </div>

          {/* Aviso sobre verificação */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 text-sm text-indigo-800">
            <strong>Como verificar:</strong> Consulte o CRECI do corretor no site do{' '}
            <a href="https://www.cofeci.gov.br" target="_blank" rel="noopener noreferrer"
              className="underline font-medium">COFECI (cofeci.gov.br)</a>{' '}
            ou no CRECI regional. Após confirmar, clique em "Verificar" para conceder o badge.
          </div>

          {agents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum corretor cadastrado ainda.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-700 font-bold text-sm">{agent.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{agent.name}</div>
                      <div className="text-xs text-gray-400">{agent.email}</div>
                      {agent.creci && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            CRECI {agent.creci}/{agent.creciState}
                          </span>
                          {agent.agencyName && (
                            <span className="text-xs text-gray-500">{agent.agencyName}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {agent.verified ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                      <CreciVerifier
                        userId={agent.id}
                        isVerified={agent.verified}
                        crecrNumber={agent.creci || ''}
                        creciState={agent.creciState || ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
