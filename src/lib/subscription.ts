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
