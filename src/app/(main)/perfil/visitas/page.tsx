import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import VisitActions from '@/components/perfil/VisitActions'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { nomeDoPeriodo, dataPorExtenso, soData, STATUS_VISITA } from '@/lib/visitas'

export const metadata = { title: 'Minhas visitas | Immovi' }

const PILL: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELED: 'bg-gray-50 text-gray-600 border-gray-200',
  DONE: 'bg-gray-50 text-gray-600 border-gray-200',
}

// Visitas da pessoa, dos dois lados: as que ela pediu e as que ela recebe.
export default async function MinhasVisitasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?redirect=/perfil/visitas')
  const userId = session.user.id

  const [proximas, passadas] = await Promise.all([
    prisma.visit.findMany({
      where: {
        OR: [{ visitorId: userId }, { ownerId: userId }],
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: soData(new Date()) },
      },
      orderBy: { date: 'asc' },
      include: {
        property: { select: { id: true, title: true, address: true, city: true, state: true } },
        visitor: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.visit.findMany({
      where: {
        OR: [{ visitorId: userId }, { ownerId: userId }],
        NOT: { AND: [{ status: { in: ['PENDING', 'CONFIRMED'] } }, { date: { gte: soData(new Date()) } }] },
      },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        property: { select: { id: true, title: true } },
        visitor: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
  ])

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas visitas</h1>
              <p className="text-sm text-gray-500">
                {proximas.length === 0 ? 'Nenhuma visita marcada.' : `${proximas.length} visita${proximas.length > 1 ? 's' : ''} pela frente.`}
              </p>
            </div>
          </div>

          {proximas.map((v) => {
            const souDono = v.ownerId === userId
            const outro = souDono ? v.visitor : v.owner
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[12rem]">
                    <Link href={`/imoveis/${v.property.id}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                      {v.property.title}
                    </Link>
                    <div className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-indigo-500" />
                      {dataPorExtenso(v.date)} · {nomeDoPeriodo(v.period)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {souDono ? `Visitante: ${outro.name}` : `Anunciante: ${outro.name}`}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${PILL[v.status]}`}>
                    {STATUS_VISITA[v.status]}
                  </span>
                </div>

                {v.message && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">“{v.message}”</p>}

                {/* Endereço completo só depois de confirmada */}
                {v.status === 'CONFIRMED' && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>{v.property.address} — {v.property.city}/{v.property.state}</span>
                  </div>
                )}

                <VisitActions visitId={v.id} status={v.status} souDono={souDono} />
              </div>
            )
          })}

          {proximas.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Nenhuma visita marcada</p>
              <p className="text-sm text-gray-500 mt-1">
                Nos anúncios com horários liberados, o botão “Agendar visita” mostra os dias disponíveis.
              </p>
            </div>
          )}

          {passadas.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Histórico</h2>
              <ul className="divide-y divide-gray-100 text-sm">
                {passadas.map((v) => (
                  <li key={v.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/imoveis/${v.property.id}`} className="flex-1 min-w-[10rem] text-gray-800 hover:text-indigo-600">
                      {v.property.title}
                    </Link>
                    <span className="text-xs text-gray-500">{dataPorExtenso(v.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${PILL[v.status]}`}>
                      {STATUS_VISITA[v.status]}
                    </span>
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
