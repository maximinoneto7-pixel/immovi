import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ArrowLeft, Search, Home, Shield } from 'lucide-react'
import { cn, formatCurrency, formatDate, PROPERTY_STATUS, PROPERTY_TYPES } from '@/lib/utils'

const STATUS_PILL: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  SOLD: 'bg-indigo-100 text-indigo-700',
  RENTED: 'bg-indigo-100 text-indigo-700',
  DELETED: 'bg-red-100 text-red-700',
}

// Moderação: o admin abre qualquer anúncio e usa o mesmo painel "Gerenciar anúncio" do dono
export default async function AdminAnunciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1') || 1)
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { city: { contains: params.q } },
      { owner: { name: { contains: params.q } } },
    ]
  }
  // Sem filtro, os excluídos ficam de fora
  where.status = params.status ? params.status : { not: 'DELETED' }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
        images: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    }),
    prisma.property.count({ where }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pageHref = (p: number) => {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.status) qs.set('status', params.status)
    qs.set('page', String(p))
    return `/admin/anuncios?${qs}`
  }

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Anúncios</h1>
              <p className="text-sm text-gray-500">{total.toLocaleString('pt-BR')} encontrados · abra um anúncio para pausar, editar ou excluir</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
            <form className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="q" defaultValue={params.q} placeholder="Título, cidade ou anunciante..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select name="status" defaultValue={params.status}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Todas as situações</option>
                {Object.entries(PROPERTY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                Filtrar
              </button>
            </form>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Anúncio</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Anunciante</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Preço</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Visitas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Criado</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Nenhum anúncio encontrado.</td></tr>
                )}
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/imoveis/${p.id}`} className="flex items-center gap-3 group">
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Home className="w-4 h-4 text-indigo-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 group-hover:text-indigo-600 truncate max-w-[280px] flex items-center gap-1">
                            {p.title}
                            {p.verified && <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-gray-500">{PROPERTY_TYPES[p.type] || p.type} · {p.city} – {p.state}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Link href={`/perfil/${p.owner.id}`} className="text-gray-700 hover:text-indigo-600">{p.owner.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 hidden lg:table-cell">
                      {formatCurrency(p.listingType === 'RENT' ? p.rentPrice || p.price : p.price)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 hidden lg:table-cell">{p.views}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('px-2.5 py-1 text-xs font-bold rounded-full', STATUS_PILL[p.status] || 'bg-gray-100 text-gray-600')}>
                        {PROPERTY_STATUS[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 text-sm">
              <span className="text-gray-500">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className="px-4 py-2 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Anterior</Link>
                )}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="px-4 py-2 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Próxima</Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
