import { prisma } from '@/lib/prisma'

// Vigia da rotina diária.
//
// O cron da Vercel roda às 6h. Se ele parar, nada dá erro na tela: destaques não
// vencem, propostas não expiram, planos não encerram e a cota de Foguete não
// renova — tudo em silêncio. Por isso cada execução deixa registro, e a própria
// rotina avisa quando percebe que ficou tempo demais sem rodar.

export const TAREFA = 'manutencao'

/** A partir daqui a rotina está atrasada: um dia e meio sem rodar */
export const LIMITE_HORAS = 36

export interface EstadoDaRotina {
  ultima: Date | null
  horas: number | null
  atrasada: boolean
  falhou: boolean
}

/** Como está a rotina agora: quando rodou pela última vez e se está atrasada */
export async function estadoDaRotina(): Promise<EstadoDaRotina> {
  const ultima = await prisma.systemRun.findFirst({
    where: { task: TAREFA },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, ok: true },
  })

  if (!ultima) return { ultima: null, horas: null, atrasada: true, falhou: false }

  const horas = (Date.now() - ultima.createdAt.getTime()) / 36e5
  return {
    ultima: ultima.createdAt,
    horas,
    atrasada: horas > LIMITE_HORAS,
    falhou: !ultima.ok,
  }
}

/** Guarda a execução e devolve quantas horas tinham passado desde a anterior */
export async function registrarExecucao(dados: {
  ok: boolean
  detail?: string | null
  ms: number
}): Promise<number | null> {
  const anterior = await estadoDaRotina()

  await prisma.systemRun.create({
    data: { task: TAREFA, ok: dados.ok, detail: dados.detail?.slice(0, 500) || null, ms: dados.ms },
  })

  // 90 dias de histórico bastam para saber se anda rodando
  const corte = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  await prisma.systemRun.deleteMany({ where: { createdAt: { lt: corte } } }).catch(() => {})

  return anterior.horas
}

/** Frase pronta para o painel */
export function comoEstaATexto(estado: EstadoDaRotina): string {
  if (!estado.ultima) return 'nunca rodou'
  if (estado.horas! < 1) return 'rodou agora há pouco'
  if (estado.horas! < 48) return `rodou há ${Math.round(estado.horas!)} horas`
  return `rodou há ${Math.floor(estado.horas! / 24)} dias`
}
