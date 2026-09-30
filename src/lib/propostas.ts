import { prisma } from '@/lib/prisma'

// Proposta dentro da conversa. Regras de negócio num lugar só, porque a rota, o chat
// e a manutenção diária precisam enxergar a mesma coisa.

export const PRAZO_PADRAO_DIAS = 7
export const PRAZO_MAX_DIAS = 30

export const CONDICOES = ['À vista', 'Financiado', 'Entrada + parcelas', 'Permuta', 'A combinar'] as const

export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'aguardando resposta',
  ACCEPTED: 'aceita',
  REJECTED: 'recusada',
  COUNTERED: 'respondida com contraproposta',
  EXPIRED: 'expirada',
  CANCELED: 'cancelada',
}

export type PropostaNoChat = {
  id: string
  amount: number
  conditions: string | null
  message: string | null
  status: string
  expiresAt: Date
  respondedAt: Date | null
  createdAt: Date
  fromId: string
  toId: string
}

/** Propostas da conversa, da mais antiga para a mais nova (o chat mistura com as mensagens) */
export function propostasDaConversa(conversationId: string) {
  return prisma.offer.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, amount: true, conditions: true, message: true, status: true,
      expiresAt: true, respondedAt: true, createdAt: true, fromId: true, toId: true,
    },
  })
}

/** A proposta que ainda espera resposta, se houver */
export function propostaEmAberto(conversationId: string) {
  return prisma.offer.findFirst({
    where: { conversationId, status: 'PENDING', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

/** Vencidas passam a contar como expiradas — roda na manutenção diária e ao abrir a conversa */
export async function expirarPropostasVencidas(conversationId?: string) {
  const { count } = await prisma.offer.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
      ...(conversationId ? { conversationId } : {}),
    },
    data: { status: 'EXPIRED' },
  })
  return count
}
