import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOfferAnswerEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
import { registrar, origemDa } from '@/lib/registro'
import { formatCurrency } from '@/lib/utils'
import { after } from 'next/server'

// Resposta à proposta: aceitar e recusar são de quem recebeu; cancelar é de quem fez.
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/propostas/[id]'>
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  const { acao } = await request.json()

  const proposta = await prisma.offer.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true } },
      from: { select: { id: true, name: true, email: true } },
      to: { select: { id: true, name: true, email: true } },
    },
  })
  if (!proposta) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 })

  if (proposta.status !== 'PENDING') {
    return Response.json({ error: 'Esta proposta já foi respondida.' }, { status: 400 })
  }
  if (proposta.expiresAt < new Date()) {
    await prisma.offer.update({ where: { id }, data: { status: 'EXPIRED' } })
    return Response.json({ error: 'O prazo desta proposta venceu.' }, { status: 400 })
  }

  const souQuemRecebeu = proposta.toId === session.user.id
  const souQuemFez = proposta.fromId === session.user.id

  const novoStatus =
    acao === 'ACEITAR' && souQuemRecebeu ? 'ACCEPTED' :
    acao === 'RECUSAR' && souQuemRecebeu ? 'REJECTED' :
    acao === 'CANCELAR' && souQuemFez ? 'CANCELED' : null

  if (!novoStatus) {
    return Response.json({ error: 'Você não pode fazer isso nesta proposta.' }, { status: 403 })
  }

  await prisma.offer.update({
    where: { id },
    data: { status: novoStatus, respondedAt: new Date() },
  })

  after(async () => {
    // Quem fica sabendo é sempre o outro lado
    const avisar = souQuemRecebeu ? proposta.from : proposta.to
    const autor = souQuemRecebeu ? proposta.to : proposta.from

    if (novoStatus !== 'CANCELED') {
      sendOfferAnswerEmail(avisar.email, avisar.name, {
        aceita: novoStatus === 'ACCEPTED',
        de: autor.name,
        valor: proposta.amount,
        imovel: proposta.property?.title || 'o anúncio',
        conversationId: proposta.conversationId,
      }).catch(console.error)
    }

    sendPushToUser(avisar.id, {
      title: novoStatus === 'ACCEPTED'
        ? `Proposta aceita: ${formatCurrency(proposta.amount)}`
        : novoStatus === 'REJECTED'
        ? 'Sua proposta foi recusada'
        : 'A proposta foi cancelada',
      body: proposta.property?.title || 'Conversa na Immovi',
      url: `/mensagens/${proposta.conversationId}`,
    }).catch(console.error)

    registrar('PROPOSTA', {
      userId: session.user!.id,
      ...origemDa(request as any),
      detail: `${novoStatus} na proposta ${id} · ${proposta.amount}`,
    })
  })

  return Response.json({ ok: true, status: novoStatus })
}
