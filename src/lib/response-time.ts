import { prisma } from '@/lib/prisma'

// "Costuma responder em até 1 hora": calculado pelas conversas do chat, sem nada novo no banco.
// Conta o tempo entre a primeira mensagem de quem procurou e a primeira resposta do anunciante.

const WINDOW_DAYS = 90
/** Abaixo disso a média não diz nada, então nada aparece */
export const MIN_SAMPLES = 3

export type ResponseSpeed = 'HOUR' | 'HOURS' | 'DAY'

const HOUR = 60 * 60 * 1000

/** Acima de 1 dia nada é exibido: melhor não mostrar do que expor "responde em 5 dias" */
function speedFor(median: number): ResponseSpeed | null {
  if (median <= HOUR) return 'HOUR'
  if (median <= 6 * HOUR) return 'HOURS'
  if (median <= 24 * HOUR) return 'DAY'
  return null
}

export function responseLabel(speed: ResponseSpeed | null): string | null {
  if (speed === 'HOUR') return 'Costuma responder em até 1 hora'
  if (speed === 'HOURS') return 'Costuma responder em poucas horas'
  if (speed === 'DAY') return 'Costuma responder em até 1 dia'
  return null
}

/**
 * Velocidade de resposta do anunciante, ou null quando não há conversas suficientes
 * ou quando ele desligou a atividade no chat (a mesma opção que esconde o "on-line agora").
 */
export async function responseSpeedFor(user: { id: string; showActivity?: boolean }): Promise<ResponseSpeed | null> {
  if (user.showActivity === false) return null

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * HOUR)
  const recent = await prisma.message.findMany({
    where: {
      createdAt: { gte: since },
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    select: { conversationId: true, senderId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 400,
  })
  const messages = recent.reverse()

  // Em cada conversa: pergunta em aberto e o tempo até ele responder
  const firstIncoming = new Map<string, Date>()
  const deltas: number[] = []

  for (const m of messages) {
    const mine = m.senderId === user.id
    if (!mine) {
      if (!firstIncoming.has(m.conversationId)) firstIncoming.set(m.conversationId, m.createdAt)
      continue
    }
    const asked = firstIncoming.get(m.conversationId)
    if (asked) {
      deltas.push(m.createdAt.getTime() - asked.getTime())
      // Pergunta respondida: a próxima que chegar abre uma nova medição
      firstIncoming.delete(m.conversationId)
    }
  }

  if (deltas.length < MIN_SAMPLES) return null

  // Mediana: um caso isolado (a pessoa que respondeu numa madrugada) não distorce
  deltas.sort((a, b) => a - b)
  const mid = Math.floor(deltas.length / 2)
  const median = deltas.length % 2 ? deltas[mid] : (deltas[mid - 1] + deltas[mid]) / 2

  return speedFor(median)
}
