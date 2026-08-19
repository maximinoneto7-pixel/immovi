import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Listagem ─────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ searches })
}

// ─── Criar alerta ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await request.json()
  const { name, filters } = body

  if (!name?.trim() || !filters) {
    return Response.json({ error: 'Nome e filtros são obrigatórios.' }, { status: 400 })
  }

  // Máximo 10 alertas por usuário
  const count = await prisma.savedSearch.count({ where: { userId: session.user.id } })
  if (count >= 10) {
    return Response.json({ error: 'Máximo de 10 alertas atingido.' }, { status: 400 })
  }

  const search = await prisma.savedSearch.create({
    data: {
      name: name.trim(),
      filters: JSON.stringify(filters),
      userId: session.user.id,
    },
  })

  return Response.json({ search })
}

// ─── Pausar / Ativar / Deletar ────────────────────────────────────────────────
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id, active } = await request.json()

  const search = await prisma.savedSearch.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!search) return Response.json({ error: 'Alerta não encontrado.' }, { status: 404 })

  const updated = await prisma.savedSearch.update({
    where: { id },
    data: { active },
  })

  return Response.json({ search: updated })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'ID obrigatório.' }, { status: 400 })

  const search = await prisma.savedSearch.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!search) return Response.json({ error: 'Alerta não encontrado.' }, { status: 404 })

  await prisma.savedSearch.delete({ where: { id } })
  return Response.json({ success: true })
}
