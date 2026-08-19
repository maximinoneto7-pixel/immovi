import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/usuarios/[id]/verificar'>
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { id } = await ctx.params
  const { verified } = await request.json()

  const user = await prisma.user.update({
    where: { id },
    data: { verified: !!verified },
    select: { id: true, name: true, verified: true },
  })

  return Response.json({ user })
}
