import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Busca de contas para o administrador escolher em nome de quem publicar.
 *
 * Devolve só o necessário para identificar a pessoa na tela. Conta suspensa ou
 * encerrada não aparece: não se publica em nome de quem não pode anunciar.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const termo = (new URL(request.url).searchParams.get('q') || '').trim()
  if (termo.length < 2) return Response.json({ usuarios: [] })

  const usuarios = await prisma.user.findMany({
    where: {
      deletedAt: null,
      suspendedAt: null,
      OR: [
        { name: { contains: termo } },
        { email: { contains: termo } },
      ],
    },
    select: { id: true, name: true, email: true, role: true, city: true, state: true },
    orderBy: { name: 'asc' },
    take: 8,
  })

  return Response.json({ usuarios })
}
