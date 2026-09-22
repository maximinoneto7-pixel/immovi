import { prisma } from '@/lib/prisma'

/** Quais destes imóveis o usuário já favoritou (para o coração dos cards vir preenchido) */
export async function favoriteIdsFor(userId: string | undefined, propertyIds: string[]): Promise<Set<string>> {
  if (!userId || propertyIds.length === 0) return new Set()
  const rows = await prisma.favorite.findMany({
    where: { userId, propertyId: { in: propertyIds } },
    select: { propertyId: true },
  })
  return new Set(rows.map((r) => r.propertyId))
}
