import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVisitAnswerEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
import { nomeDoPeriodo, dataPorExtenso } from '@/lib/visitas'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

// Resposta ao pedido de visita: confirmar e recusar são do anunciante;
// cancelar, de qualquer um dos dois enquanto a visita não aconteceu.
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/visitas/[id]'>
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Não autenticado.' }, { status: 401 })

  const { id } = await ctx.params
  const { acao, nota } = await request.json()

  const visita = await prisma.visit.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, address: true, city: true, state: true } },
      visitor: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  })
  if (!visita) return Response.json({ error: 'Visita não encontrada.' }, { status: 404 })
  if (!['PENDING', 'CONFIRMED'].includes(visita.status)) {
    return Response.json({ error: 'Esta visita já foi encerrada.' }, { status: 400 })
  }

  const souAnunciante = visita.ownerId === session.user.id
  const souVisitante = visita.visitorId === session.user.id
  if (!souAnunciante && !souVisitante) {
    return Response.json({ error: 'Você não participa desta visita.' }, { status: 403 })
  }

  const novoStatus =
    acao === 'CONFIRMAR' && souAnunciante && visita.status === 'PENDING' ? 'CONFIRMED' :
    acao === 'RECUSAR' && souAnunciante && visita.status === 'PENDING' ? 'REJECTED' :
    acao === 'CANCELAR' ? 'CANCELED' : null

  if (!novoStatus) return Response.json({ error: 'Você não pode fazer isso nesta visita.' }, { status: 403 })

  await prisma.visit.update({
    where: { id },
    data: {
      status: novoStatus,
      answerNote: (nota || '').toString().slice(0, 300) || null,
      respondedAt: new Date(),
      canceledById: novoStatus === 'CANCELED' ? session.user.id : null,
    },
  })

  after(async () => {
    // Quem fica sabendo é o outro lado
    const avisar = souAnunciante ? visita.visitor : visita.owner
    const quem = souAnunciante ? visita.owner.name : visita.visitor.name

    sendVisitAnswerEmail(avisar.email, avisar.name, {
      status: novoStatus,
      quem,
      imovel: visita.property.title,
      quando: `${dataPorExtenso(visita.date)} · ${nomeDoPeriodo(visita.period)}`,
      // Endereço completo só vai quando a visita está confirmada
      endereco: novoStatus === 'CONFIRMED'
        ? `${visita.property.address} — ${visita.property.city}/${visita.property.state}`
        : null,
      motivo: (nota || '').toString().slice(0, 300) || null,
    }).catch(console.error)

    sendPushToUser(avisar.id, {
      title: novoStatus === 'CONFIRMED' ? 'Visita confirmada' : novoStatus === 'REJECTED' ? 'Visita recusada' : 'Visita cancelada',
      body: `${visita.property.title} · ${dataPorExtenso(visita.date)}`,
      url: '/perfil/visitas',
    }).catch(console.error)
  })

  revalidatePath('/perfil/visitas')
  return Response.json({ ok: true, status: novoStatus })
}
