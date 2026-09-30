import { prisma } from '@/lib/prisma'

// Visita agendada pelos horários que o anunciante marcou.
//
// Trabalhamos com períodos, não com hora cravada: imóvel não é consultório, e horário
// exato só cria atraso e frustração dos dois lados.

export const PERIODOS = {
  MANHA: { label: 'Manhã', faixa: '8h às 12h' },
  TARDE: { label: 'Tarde', faixa: '13h às 18h' },
  NOITE: { label: 'Noite', faixa: '18h às 21h' },
} as const

export type Periodo = keyof typeof PERIODOS

export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** Quantos dias à frente o comprador pode escolher */
export const JANELA_DIAS = 21

export const STATUS_VISITA: Record<string, string> = {
  PENDING: 'aguardando confirmação',
  CONFIRMED: 'confirmada',
  REJECTED: 'recusada',
  CANCELED: 'cancelada',
  DONE: 'realizada',
}

export function listaDe(texto: string | null | undefined) {
  return (texto || '').split(',').map((p) => p.trim()).filter(Boolean)
}

/** Dia sem hora, para comparar datas sem tropeçar no fuso */
export function soData(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function nomeDoPeriodo(periodo: string) {
  const p = PERIODOS[periodo as Periodo]
  return p ? `${p.label} (${p.faixa})` : periodo
}

export function dataPorExtenso(d: Date) {
  // Só a primeira letra em maiúscula: "Quinta-feira, 1 de outubro" (o capitalize do
  // Tailwind mexeria em cada palavra e viraria "1 De Outubro").
  const texto = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Dias que o comprador pode escolher: respeitam o aviso mínimo, os dias da semana
 * liberados e a janela de três semanas.
 */
export function diasDisponiveis(disponibilidade: { weekdays: string; periods: string; minDays: number }) {
  const dias = listaDe(disponibilidade.weekdays).map(Number)
  const hoje = soData(new Date())
  const resultado: { data: Date; periodos: string[] }[] = []

  for (let i = disponibilidade.minDays; i <= JANELA_DIAS; i++) {
    const dia = new Date(hoje.getTime() + i * 24 * 60 * 60 * 1000)
    if (!dias.includes(dia.getUTCDay())) continue
    resultado.push({ data: dia, periodos: listaDe(disponibilidade.periods) })
  }
  return resultado
}

/** Visitas de uma pessoa (como visitante ou como anunciante), da mais próxima para a mais distante */
export function visitasDe(userId: string) {
  return prisma.visit.findMany({
    where: {
      OR: [{ visitorId: userId }, { ownerId: userId }],
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: { gte: soData(new Date()) },
    },
    orderBy: { date: 'asc' },
    include: {
      property: { select: { id: true, title: true, city: true, state: true, address: true } },
      visitor: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  })
}
