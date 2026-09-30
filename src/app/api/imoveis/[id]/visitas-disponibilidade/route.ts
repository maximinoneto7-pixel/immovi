import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listaDe } from '@/lib/visitas'
import { revalidatePath } from 'next/cache'

const DIAS_VALIDOS = ['0', '1', '2', '3', '4', '5', '6']
const PERIODOS_VALIDOS = ['MANHA', 'TARDE', 'NOITE']

// Horários de visita do anúncio: só o dono (ou o admin) define.
export async function PUT(
  request: Request,
  ctx: RouteContext<'/api/imoveis/[id]/visitas-disponibilidade'>
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  const property = await prisma.property.findUnique({ where: { id }, select: { ownerId: true } })
  if (!property) return Response.json({ error: 'Anúncio não encontrado.' }, { status: 404 })

  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Você não pode alterar este anúncio.' }, { status: 403 })
  }

  const { weekdays, periods, minDays, note } = await request.json()

  const dias = listaDe(weekdays).filter((d) => DIAS_VALIDOS.includes(d))
  const periodos = listaDe(periods).filter((p) => PERIODOS_VALIDOS.includes(p))

  if (dias.length === 0 || periodos.length === 0) {
    return Response.json({ error: 'Escolha pelo menos um dia e um período.' }, { status: 400 })
  }

  const aviso = Math.min(30, Math.max(0, Number(minDays) || 1))

  const dados = {
    weekdays: dias.join(','),
    periods: periodos.join(','),
    minDays: aviso,
    note: (note || '').toString().slice(0, 200) || null,
  }

  const agenda = await prisma.visitAvailability.upsert({
    where: { propertyId: id },
    create: { propertyId: id, ...dados },
    update: dados,
  })

  revalidatePath(`/imoveis/${id}`)
  return Response.json({ ok: true, agenda })
}
