import { prisma } from '@/lib/prisma'

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

  const resultado = { destaquesEncerrados, destaquesSemFoguete: orfaos.length, em: agora.toISOString() }
  console.log('[Manutenção diária]', JSON.stringify(resultado))
  return Response.json(resultado)
}
