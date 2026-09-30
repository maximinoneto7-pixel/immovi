import { prisma } from '@/lib/prisma'
import { RETENCAO_DIAS } from '@/lib/registro'
import { expirarPropostasVencidas, } from '@/lib/propostas'
import { soData, nomeDoPeriodo, dataPorExtenso } from '@/lib/visitas'
import { sendVisitReminderEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'

// Manutenção diária (chamada pela Vercel). Só encerra o que já venceu: não recebe
// parâmetro nenhum, então rodar fora de hora não muda nada além de arrumar o atraso.
export const maxDuration = 60

export async function GET(request: Request) {
  // Quando existir CRON_SECRET, exigimos o cabeçalho que a Vercel envia
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const agora = new Date()

  // ── Destaques (Foguete) vencidos ──────────────────────────────────────────
  const vencidos = await prisma.propertyBoost.findMany({
    where: { status: 'ACTIVE', expiresAt: { lt: agora } },
    select: { id: true, propertyId: true },
  })

  let destaquesEncerrados = 0
  for (const boost of vencidos) {
    await prisma.propertyBoost.update({ where: { id: boost.id }, data: { status: 'EXPIRED' } })

    // O imóvel só perde o destaque se não tiver outro Foguete em dia
    const outro = await prisma.propertyBoost.findFirst({
      where: { propertyId: boost.propertyId, status: 'ACTIVE', expiresAt: { gte: agora } },
      select: { id: true },
    })
    if (!outro) {
      await prisma.property.update({ where: { id: boost.propertyId }, data: { featured: false } }).catch(() => {})
    }
    destaquesEncerrados++
  }

  // ── Anúncios em destaque sem nenhum Foguete válido ────────────────────────
  // (destaques ligados antes desta rotina existir, ou na mão pelo admin)
  const emDestaque = await prisma.property.findMany({
    where: { featured: true },
    select: { id: true, boosts: { where: { status: 'ACTIVE', expiresAt: { gte: agora } }, select: { id: true } } },
  })
  const orfaos = emDestaque.filter((p) => p.boosts.length === 0).map((p) => p.id)
  if (orfaos.length) {
    await prisma.property.updateMany({ where: { id: { in: orfaos } }, data: { featured: false } })
  }

  // ── Propostas com prazo vencido ───────────────────────────────────────────
  const propostasExpiradas = await expirarPropostasVencidas()

  // ── Lembrete das visitas de amanhã ────────────────────────────────────────
  const amanha = soData(new Date(agora.getTime() + 24 * 60 * 60 * 1000))
  const visitasDeAmanha = await prisma.visit.findMany({
    where: { status: 'CONFIRMED', date: amanha, remindedAt: null },
    include: {
      property: { select: { title: true, address: true, city: true, state: true } },
      visitor: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  for (const visita of visitasDeAmanha) {
    const quando = `${dataPorExtenso(visita.date)} · ${nomeDoPeriodo(visita.period)}`
    const endereco = `${visita.property.address} — ${visita.property.city}/${visita.property.state}`

    // Os dois lados recebem: quem visita e quem recebe
    for (const [pessoa, comQuem] of [
      [visita.visitor, visita.owner.name],
      [visita.owner, visita.visitor.name],
    ] as const) {
      sendVisitReminderEmail(pessoa.email, pessoa.name, {
        imovel: visita.property.title, quando, comQuem, endereco,
      }).catch(console.error)
      sendPushToUser(pessoa.id, {
        title: 'Sua visita é amanhã',
        body: `${visita.property.title} · ${quando}`,
        url: '/perfil/visitas',
      }).catch(console.error)
    }

    await prisma.visit.update({ where: { id: visita.id }, data: { remindedAt: new Date() } })
  }

  // ── Visitas que já passaram: viram realizadas ─────────────────────────────
  const { count: visitasConcluidas } = await prisma.visit.updateMany({
    where: { status: 'CONFIRMED', date: { lt: soData(agora) } },
    data: { status: 'DONE' },
  })

  // ── Registro de visitas: guarda 90 dias, que é o que o painel usa ─────────
  const corte = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000)
  const { count: visitasApagadas } = await prisma.pageView.deleteMany({ where: { createdAt: { lt: corte } } })

  // ── Registro de acesso: 6 meses, como manda o Marco Civil (art. 15) ───────
  const corteRegistro = new Date(agora.getTime() - RETENCAO_DIAS * 24 * 60 * 60 * 1000)
  const { count: registrosApagados } = await prisma.accessLog.deleteMany({ where: { createdAt: { lt: corteRegistro } } })

  const resultado = {
    destaquesEncerrados, destaquesSemFoguete: orfaos.length, propostasExpiradas,
    lembretesDeVisita: visitasDeAmanha.length, visitasConcluidas,
    visitasApagadas, registrosApagados, em: agora.toISOString(),
  }
  console.log('[Manutenção diária]', JSON.stringify(resultado))
  return Response.json(resultado)
}
