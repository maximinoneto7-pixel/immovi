import { prisma } from '@/lib/prisma'
import { PLANOS } from '@/lib/stripe'

// Oferta de abertura: os primeiros assinantes usam o Destaque por 60 dias sem pagar
// e sem cartão. Serve para formar inventário — anúncio parado não atrai comprador,
// e sem comprador nenhum corretor paga plano.

export const TRIAL_PLANO = 'DESTAQUE' as const
export const TRIAL_DIAS = 60
export const TRIAL_VAGAS = 50

/** Quantas pessoas ainda cabem na oferta */
export async function vagasRestantes(): Promise<number> {
  const usadas = await prisma.user.count({ where: { trialEndsAt: { not: null } } })
  return Math.max(0, TRIAL_VAGAS - usadas)
}

export interface TrialHolder {
  planId?: string | null
  planExpiresAt?: Date | null
  trialEndsAt?: Date | null
}

/** Está usando o teste agora */
export function emTeste(user: TrialHolder | null | undefined): boolean {
  return !!user?.trialEndsAt && user.trialEndsAt > new Date()
}

/** Já resgatou alguma vez (mesmo que o teste já tenha acabado) */
export function jaResgatou(user: TrialHolder | null | undefined): boolean {
  return !!user?.trialEndsAt
}

/**
 * Por que esta pessoa não pode resgatar — null se pode.
 * Quem já paga não resgata: seria trocar dinheiro por brinde.
 */
export function motivoParaNaoResgatar(user: TrialHolder | null | undefined): string | null {
  if (!user) return 'Entre na sua conta para ativar a oferta.'
  if (jaResgatou(user)) return 'Você já usou os 60 dias de teste.'
  if (user.planId && user.planId !== 'BASIC' && user.planExpiresAt && user.planExpiresAt > new Date()) {
    return 'Você já tem um plano pago em vigor.'
  }
  return null
}

export const TRIAL_NOME = PLANOS[TRIAL_PLANO].nome
