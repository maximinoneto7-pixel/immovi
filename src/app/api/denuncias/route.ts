import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReportAlertEmail } from '@/lib/email'
import { registrar, origemDa } from '@/lib/registro'

// Denúncia de anúncio. Aberta a qualquer visitante: quem vai reconhecer o golpe
// quase sempre é alguém que ainda não tem conta. A administração é avisada na hora,
// e nada sai do ar sozinho — a decisão é sempre humana.

export const MOTIVOS: Record<string, string> = {
  DOCUMENTO_FALSO: 'Documento ou titularidade falsa',
  IMOVEL_INEXISTENTE: 'Imóvel não existe ou não está à venda',
  PAGAMENTO_FORA: 'Pediram pagamento fora da plataforma',
  ANUNCIO_ENGANOSO: 'Preço irreal ou anúncio enganoso',
  OUTRO: 'Outro motivo',
}

const JANELA_MS = 10 * 60 * 1000
const POR_JANELA = 5
const usos = new Map<string, { contagem: number; zera: number }>()

function passouDoLimite(ip: string) {
  const agora = Date.now()
  const atual = usos.get(ip)
  if (!atual || atual.zera < agora) {
    usos.set(ip, { contagem: 1, zera: agora + JANELA_MS })
    return false
  }
  atual.contagem++
  return atual.contagem > POR_JANELA
}

export async function POST(request: Request) {
  const origem = origemDa(request as any)
  if (passouDoLimite(origem.ip || 'desconhecido')) {
    return Response.json({ error: 'Muitas denúncias seguidas. Tente de novo mais tarde.' }, { status: 429 })
  }

  const { propertyId, reason, details } = await request.json()
  if (!propertyId || !MOTIVOS[reason]) {
    return Response.json({ error: 'Escolha o motivo da denúncia.' }, { status: 400 })
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, city: true, state: true, owner: { select: { name: true, email: true } } },
  })
  if (!property) return Response.json({ error: 'Anúncio não encontrado.' }, { status: 404 })

  const session = await auth()

  const denuncia = await prisma.report.create({
    data: {
      propertyId,
      reason,
      details: (details || '').toString().slice(0, 1000) || null,
      reporterId: session?.user?.id || null,
      reporterIp: origem.ip,
    },
  })

  registrar('DENUNCIA', {
    userId: session?.user?.id,
    ...origem,
    detail: `${propertyId} · ${reason}`,
  })

  // A administração precisa saber na hora: é o prazo de resposta que sustenta a diligência
  sendReportAlertEmail({
    motivo: MOTIVOS[reason],
    relato: details || null,
    imovel: `${property.title} — ${property.city}/${property.state}`,
    propertyId: property.id,
    anunciante: `${property.owner.name} (${property.owner.email})`,
    denunciante: session?.user?.email || 'visitante não identificado',
  }).catch(console.error)

  return Response.json({ ok: true, id: denuncia.id })
}
