import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Users, Shield, ArrowLeft, UserCheck, Home, MessageCircle, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import OfficialToggle from '@/components/admin/OfficialToggle'

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { email: { contains: params.q } },
      { creci: { contains: params.q } },
    ]
  }
  if (params.role) where.role = params.role

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { properties: true, conversations: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    BUYER: { label: 'Comprador', color: 'bg-gray-100 text-gray-700' },
    SELLER: { label: 'Vendedor', color: 'bg-green-100 text-green-700' },
    AGENT: { label: 'Corretor', color: 'bg-violet-100 text-violet-700' },
    ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700' },
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
              <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
              <p className="text-sm text-gray-500">{total.toLocaleString('pt-BR')} cadastrados</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3">
            <form className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="q" defaultValue={params.q} placeholder="Nome, email ou CRECI..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select name="role" defaultValue={params.role}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos os perfis</option>
                <option value="BUYER">Compradores</option>
                <option value="SELLER">Vendedores</option>
                <option value="AGENT">Corretores</option>
                <option value="ADMIN">Admins</option>
              </select>
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                Filtrar
              </button>
            </form>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Usuário</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Perfil</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Anúncios</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Conversas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Cadastro</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const role = ROLE_LABELS[u.role] || ROLE_LABELS.BUYER
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 font-bold text-sm">{u.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate flex items-center gap-1">
                              {u.name}
                              {u.verified && <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{u.email}</div>
                            {u.creci && <div className="text-xs text-violet-600 font-medium">CRECI {u.creci}/{u.creciState}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${role.color}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <Home className="w-3.5 h-3.5" />
                          {u._count.properties}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {u._count.conversations}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs hidden md:table-cell">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.verified ? '✓ Verificado' : 'Pendente'}
                        </span>
                        <div><OfficialToggle userId={u.id} initial={u.official} /></div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Paginação */}
            {total > pageSize && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {skip + 1}–{Math.min(skip + pageSize, total)} de {total}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/admin/usuarios?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Anterior
                    </Link>
                  )}
                  {page * pageSize < total && (
                    <Link href={`/admin/usuarios?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Próximo
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
