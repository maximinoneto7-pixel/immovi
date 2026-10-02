import { prisma } from '@/lib/prisma'
import { PLANOS, FOGUETES, type PlanoId } from '@/lib/stripe'
import { hasActivePaidPlan } from '@/lib/subscription'

// Foguetes que vêm junto com o plano.
//
// A cota não é creditada por rotina: ela se renova sozinha quando alguém olha,
// 30 dias depois da última renovação. Assim nenhum assinante fica sem a cota
// porque a rotina diária falhou, e ninguém ganha duas cotas se ela rodar duas vezes.

/** O Foguete que acompanha o plano é o de 7 dias */
export const FOGUETE_DO_PLANO = 'FOGUETE_7' as const
export const DIAS_DO_FOGUETE = FOGUETES[FOGUETE_DO_PLANO].dias
const JANELA_MS = 30 * 24 * 60 * 60 * 1000

/** Quantos Foguetes por mês o plano da pessoa dá */
export function cotaDoPlano(user: { planId?: string | null; planExpiresAt?: Date | null; role?: string | null }) {
  if (!hasActivePaidPlan(user)) return 0
  return PLANOS[user.planId as PlanoId]?.foguetes ?? 0
}

export interface SaldoDeFoguetes {
  cota: number
  disponiveis: number
  renovaEm: Date | null
}

/**
 * Saldo atual, renovando a cota se já passaram 30 dias. Quem não tem plano pago
 * fica com zero e sem data de renovação.
 */
export async function saldoDeFoguetes(userId: string): Promise<SaldoDeFoguetes> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planId: true, planExpiresAt: true, role: true, creditoFoguetes: true, creditoRenovadoEm: true },
  })
  if (!user) return { cota: 0, disponiveis: 0, renovaEm: null }

  const cota = cotaDoPlano(user)
  if (cota === 0) return { cota: 0, disponiveis: 0, renovaEm: null }

  const agora = new Date()
  const venceu = !user.creditoRenovadoEm || agora.getTime() - user.creditoRenovadoEm.getTime() >= JANELA_MS

  if (venceu) {
    await prisma.user.update({
      where: { id: userId },
      data: { creditoFoguetes: cota, creditoRenovadoEm: agora },
    })
    return { cota, disponiveis: cota, renovaEm: new Date(agora.getTime() + JANELA_MS) }
  }

  return {
    cota,
    disponiveis: Math.min(user.creditoFoguetes, cota),
    renovaEm: new Date(user.creditoRenovadoEm!.getTime() + JANELA_MS),
  }
}

/**
 * Gasta um Foguete da cota num anúncio. Devolve o erro em texto, ou null se deu certo.
 * O prazo soma ao Foguete que ainda estiver valendo, como na compra avulsa.
 */
export async function usarFogueteDoPlano(userId: string, propertyId: string): Promise<string | null> {
  const imovel = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: userId },
    select: { id: true, status: true },
  })
  if (!imovel) return 'Anúncio não encontrado.'
  if (imovel.status !== 'ACTIVE') return 'Só dá para destacar um anúncio que esteja no ar.'

  const saldo = await saldoDeFoguetes(userId)
  if (saldo.cota === 0) return 'Seu plano não inclui Foguetes.'
  if (saldo.disponiveis < 1) return 'Você já usou os Foguetes deste mês.'

  const emDia = await prisma.propertyBoost.findFirst({
    where: { propertyId, status: 'ACTIVE', expiresAt: { gte: new Date() } },
    orderBy: { expiresAt: 'desc' },
    select: { expiresAt: true },
  })
  const expiresAt = new Date((emDia?.expiresAt ?? new Date()).getTime() + DIAS_DO_FOGUETE * 24 * 60 * 60 * 1000)

  // Um de cada vez: a cota é decrementada em consulta condicional, então dois
  // cliques simultâneos não gastam o mesmo crédito duas vezes.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, creditoFoguetes: { gte: 1 } },
    data: { creditoFoguetes: { decrement: 1 } },
  })
  if (count === 0) return 'Você já usou os Foguetes deste mês.'

  await prisma.propertyBoost.create({
    data: {
      boostType: FOGUETE_DO_PLANO,
      status: 'ACTIVE',
      amountPaid: 0,
      expiresAt,
      propertyId,
      userId,
    },
  })
  await prisma.property.update({ where: { id: propertyId }, data: { featured: true } })
  return null
}
