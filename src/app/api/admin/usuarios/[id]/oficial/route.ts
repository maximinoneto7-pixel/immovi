import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Liga/desliga a conta oficial da Immovi (selo "Oficial Immovi" nos anúncios). Só admin.
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/usuarios/[id]/oficial'>
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { id } = await ctx.params
  const { official } = await request.json()

  const user = await prisma.user.update({
    where: { id },
    data: { official: !!official },
    select: { id: true, name: true, official: true },
  })

  revalidatePath('/imoveis')
  revalidatePath('/')
  return Response.json({ user })
}
