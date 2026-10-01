import { prisma } from '@/lib/prisma'
import { RETENCAO_DIAS } from '@/lib/registro'
import { expirarPropostasVencidas, } from '@/lib/propostas'
import { soData, nomeDoPeriodo, dataPorExtenso } from '@/lib/visitas'
import { sendVisitReminderEmail, sendPlanEndingEmail, sendPlanEndedEmail } from '@/lib/email'
import { listingLimit } from '@/lib/subscription'
import { PLANOS } from '@/lib/stripe'
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


  // ── Plano vencendo em 7 dias: avisa uma vez ───────────────────────────────
  const daquiASeteDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)
  const aVencer = await prisma.user.findMany({
    where: {
      planId: { notIn: ['BASIC'] },
      NOT: { planId: null },
      planExpiresAt: { gt: agora, lte: daquiASeteDias },
      planWarnedAt: null,
      deletedAt: null,
    },
    select: { id: true, name: true, email: true, planId: true, planExpiresAt: true, trialEndsAt: true },
  })

  for (const pessoa of aVencer) {
    const ativos = await prisma.property.count({ where: { ownerId: pessoa.id, status: 'ACTIVE' } })
    await sendPlanEndingEmail(pessoa.email, pessoa.name, {
      plano: PLANOS[pessoa.planId as keyof typeof PLANOS]?.nome || 'plano',
      ate: pessoa.planExpiresAt!,
      teste: !!pessoa.trialEndsAt && pessoa.trialEndsAt.getTime() === pessoa.planExpiresAt!.getTime(),
      anunciosAtivos: ativos,
      limiteDepois: PLANOS.BASIC.anuncios,
    }).catch((err) => console.error('[Manutenção] aviso de plano:', err.message))
    await prisma.user.update({ where: { id: pessoa.id }, data: { planWarnedAt: agora } })
  }

  // ── Plano vencido: conta volta ao Básico e os anúncios excedentes pausam ──
  //
  // O limite de anúncios só era checado ao publicar ou reativar. Sem isto, bastava
  // assinar um mês (ou usar o teste), publicar vinte anúncios e deixar o plano
  // vencer para ficar com os vinte no ar para sempre.
  const vencidosDePlano = await prisma.user.findMany({
    where: {
      planId: { notIn: ['BASIC'] },
      NOT: { planId: null },
      planExpiresAt: { lt: agora },
      deletedAt: null,
    },
    select: { id: true, name: true, email: true, planId: true, role: true },
  })

  let planosEncerrados = 0
  let anunciosPausados = 0

  for (const pessoa of vencidosDePlano) {
    const limite = listingLimit({ planId: null, planExpiresAt: null, role: pessoa.role })

    let pausados = 0
    if (Number.isFinite(limite)) {
      // Mantemos no ar os mais vistos: são os que têm mais chance de fechar negócio
      const ativos = await prisma.property.findMany({
        where: { ownerId: pessoa.id, status: 'ACTIVE' },
        orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        select: { id: true },
      })
      const excedentes = ativos.slice(limite).map((a) => a.id)
      if (excedentes.length > 0) {
        const r = await prisma.property.updateMany({
          where: { id: { in: excedentes } },
          data: { status: 'PAUSED' },
        })
        pausados = r.count
        anunciosPausados += r.count
      }
    }

    await prisma.user.update({
      where: { id: pessoa.id },
      data: { planId: null, planExpiresAt: null, planWarnedAt: null },
    })
    planosEncerrados++

    await sendPlanEndedEmail(pessoa.email, pessoa.name, {
      plano: PLANOS[pessoa.planId as keyof typeof PLANOS]?.nome || 'plano',
      pausados,
      mantidos: Number.isFinite(limite) ? limite : 0,
    }).catch((err) => console.error('[Manutenção] fim de plano:', err.message))
  }

  const resultado = {
    destaquesEncerrados, destaquesSemFoguete: orfaos.length, propostasExpiradas,
    lembretesDeVisita: visitasDeAmanha.length, visitasConcluidas,
    visitasApagadas, registrosApagados,
    planosAvisados: aVencer.length, planosEncerrados, anunciosPausados,
    em: agora.toISOString(),
  }
  console.log('[Manutenção diária]', JSON.stringify(resultado))
  return Response.json(resultado)
}
