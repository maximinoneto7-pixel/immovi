import { prisma } from '@/lib/prisma'
import { hasActivePaidPlan } from '@/lib/subscription'

// Prioridade do anúncio na busca, vinda do plano de quem anuncia.
//
// O valor fica copiado em Property.planRank porque o Prisma não sabe ordenar por
// um ranking calculado sobre campo de relação. Sempre que o plano de alguém muda
// — assina, resgata o teste, cancela, vence — os anúncios dessa pessoa são
// reescritos por sincronizarRanking().

export const RANK_DO_PLANO: Record<string, number> = {
  DESTAQUE: 1,
  PROFISSIONAL: 2,
  IMOBILIARIA: 3,
}

export interface DonoComPlano {
  planId?: string | null
  planExpiresAt?: Date | null
  role?: string | null
}

/** 0 para quem não tem plano pago em vigor */
export function rankDe(user: DonoComPlano | null | undefined): number {
  if (!hasActivePaidPlan(user)) return 0
  return RANK_DO_PLANO[user!.planId as string] ?? 0
}

/**
 * Reescreve o rank dos anúncios de uma pessoa. Barato: só grava quando o número
 * muda, então rodar de novo sem necessidade não custa escrita.
 */
export async function sincronizarRanking(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planId: true, planExpiresAt: true, role: true },
  })
  const rank = rankDe(user)

  const { count } = await prisma.property.updateMany({
    where: { ownerId: userId, NOT: { planRank: rank } },
    data: { planRank: rank },
  })
  return count
}
