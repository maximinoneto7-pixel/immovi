import { prisma } from '@/lib/prisma'

/** Registra atividade do usuário, no máximo uma gravação a cada 45s */
export async function touchPresence(userId: string) {
  const threshold = new Date(Date.now() - 45_000)
  await prisma.user.updateMany({
    where: { id: userId, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: threshold } }] },
    data: { lastSeenAt: new Date() },
  })
}
