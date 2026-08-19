import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const q = searchParams.get('q')
  const type = searchParams.get('type') || 'cities'

  if (type === 'states') {
    // Todos os estados que têm imóveis ativos
    const states = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    })
    const result = states.map((s) => s.state)
    return Response.json({ states: result })
  }

  if (type === 'cities') {
    // Retorna todas as cidades (filtro é feito no cliente para suportar acentos)
    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (state) where.state = state

    const cities = await prisma.property.findMany({
      where,
      select: { city: true, state: true },
      distinct: ['city', 'state'],
      orderBy: { city: 'asc' },
    })

    return Response.json({
      cities: cities.map((c) => ({ city: c.city, state: c.state })),
    })
  }

  if (type === 'type-counts') {
    // Contagem de imóveis ativos por tipo
    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (state) where.state = state

    const counts = await prisma.property.groupBy({
      by: ['type'],
      where,
      _count: { _all: true },
      orderBy: { _count: { type: 'desc' } },
    })

    return Response.json({
      counts: counts.map((c) => ({ type: c.type, count: c._count._all })),
    })
  }

  return Response.json({ error: 'Tipo inválido.' }, { status: 400 })
}
