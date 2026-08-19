import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Gera ou retorna o código de indicação do usuário
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, referralCode: true, referralCredits: true },
  })

  if (!user) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  // Gera código se não existir
  if (!user.referralCode) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    user = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: { id: true, name: true, referralCode: true, referralCredits: true },
    })
  }

  // Conta quantos usuários foram indicados
  const indicados = await prisma.user.count({
    where: { referredById: session.user.id },
  })

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'

  return Response.json({
    code: user!.referralCode,
    credits: user!.referralCredits,
    indicados,
    link: `${baseUrl}/cadastro?ref=${user!.referralCode}`,
  })
}
