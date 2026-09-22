// Regras e textos de presença — sem dependências de servidor, usados também no navegador

/** Online = sinal de atividade nos últimos 2 minutos (o site avisa a cada minuto com a aba aberta) */
export const ONLINE_WINDOW_MS = 2 * 60_000

const TZ = 'America/Sao_Paulo'
const dayKey = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: TZ })
const timeOf = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

export function isOnline(lastSeenAt?: Date | string | null): boolean {
  return !!lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS
}

/** "hoje às 14:32", "ontem às 09:10" ou "em 18/09" */
export function whenLabel(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  if (dayKey(d) === dayKey(now)) return `hoje às ${timeOf(d)}`
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return `ontem às ${timeOf(d)}`
  return `em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TZ })}`
}

/** Topo do chat: exato, só entre quem conversa */
export function lastSeenLabel(lastSeenAt?: Date | string | null): string | null {
  if (!lastSeenAt) return null
  return isOnline(lastSeenAt) ? 'Online agora' : `Visto por último ${whenLabel(lastSeenAt)}`
}

/** Página do anúncio: só uma faixa aproximada, nunca o horário */
export function activityLabel(lastSeenAt?: Date | string | null): string | null {
  if (!lastSeenAt) return null
  if (isOnline(lastSeenAt)) return 'Online agora'
  const days = (Date.now() - new Date(lastSeenAt).getTime()) / 86_400_000
  if (dayKey(new Date(lastSeenAt)) === dayKey(new Date())) return 'Ativo hoje'
  if (days < 7) return 'Ativo nesta semana'
  return null
}
