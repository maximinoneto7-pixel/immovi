import { prisma } from '@/lib/prisma'
import { PLANOS } from '@/lib/stripe'

interface PlanHolder {
  planId?: string | null
  planExpiresAt?: Date | null
  role?: string | null
}

/** Plano pago em vigor (Destaque, Profissional ou Imobiliária) — mesmo critério de /planos e /pagamentos */
export function hasActivePaidPlan(user: PlanHolder | null | undefined): boolean {
  return !!user?.planId
    && user.planId !== 'BASIC'
    && !!user.planExpiresAt
    && user.planExpiresAt > new Date()
}

/** Contratos digitais são exclusivos de assinantes; administradores sempre têm acesso */
export function canCreateContracts(user: PlanHolder | null | undefined): boolean {
  return user?.role === 'ADMIN' || hasActivePaidPlan(user)
}

export const CONTRACTS_PAYWALL_MESSAGE =
  'Contratos digitais são exclusivos para assinantes. Conheça os planos em /planos.'

/** Quantos anúncios ativos o plano permite (administrador: sem limite) */
export function listingLimit(user: PlanHolder | null | undefined): number {
  if (user?.role === 'ADMIN') return Infinity
  const planId = hasActivePaidPlan(user) ? (user!.planId as keyof typeof PLANOS) : 'BASIC'
  return PLANOS[planId]?.anuncios ?? PLANOS.BASIC.anuncios
}

/**
 * Mensagem de bloqueio se o usuário já atingiu o limite de anúncios ativos do plano
 * (ao publicar, ou ao reativar `exceptPropertyId`); null se ainda pode.
 */
export async function listingLimitError(userId: string, exceptPropertyId?: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planId: true, planExpiresAt: true, role: true },
  })
  const limit = listingLimit(user)
  if (!Number.isFinite(limit)) return null

  const active = await prisma.property.count({
    where: { ownerId: userId, status: 'ACTIVE', ...(exceptPropertyId ? { id: { not: exceptPropertyId } } : {}) },
  })
  if (active < limit) return null

  const planName = hasActivePaidPlan(user) ? PLANOS[user!.planId as keyof typeof PLANOS]?.nome : PLANOS.BASIC.nome
  const plural = limit > 1 ? 's' : ''
  return `Seu plano ${planName} permite ${limit} anúncio${plural} ativo${plural}. Pause outro anúncio ou conheça os planos em /planos.`
}
