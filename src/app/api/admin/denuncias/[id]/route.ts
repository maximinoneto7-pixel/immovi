import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendListingRemovedEmail } from '@/lib/email'
import { registrar, origemDa } from '@/lib/registro'
import { revalidatePath } from 'next/cache'

// Decisão sobre uma denúncia. Nada sai do ar sozinho: a ação é sempre desta rota,
// com quem decidiu, quando e por quê — é isso que sustenta a diligência da plataforma.
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/denuncias/[id]'>
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { id } = await ctx.params
  const { acao, nota } = await request.json()

  const ACOES = ['REMOVER_ANUNCIO', 'SUSPENDER_CONTA', 'ARQUIVAR']
  if (!ACOES.includes(acao)) return Response.json({ error: 'Ação inválida.' }, { status: 400 })
  if (!(nota || '').trim()) {
    return Response.json({ error: 'Escreva o motivo da decisão: ele fica no registro.' }, { status: 400 })
  }

  const denuncia = await prisma.report.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, ownerId: true, owner: { select: { name: true, email: true } } } },
    },
  })
  if (!denuncia) return Response.json({ error: 'Denúncia não encontrada.' }, { status: 404 })

  const motivo = (nota as string).trim()

  if (acao === 'REMOVER_ANUNCIO' || acao === 'SUSPENDER_CONTA') {
    await prisma.property.update({
      where: { id: denuncia.propertyId },
      data: { status: 'DELETED', featured: false },
    })
    sendListingRemovedEmail(
      denuncia.property.owner.email, denuncia.property.owner.name, denuncia.property.title, motivo
    ).catch(console.error)
  }

  if (acao === 'SUSPENDER_CONTA') {
    await prisma.property.updateMany({
      where: { ownerId: denuncia.property.ownerId, status: { not: 'DELETED' } },
      data: { status: 'DELETED', featured: false },
    })
    await prisma.user.update({
      where: { id: denuncia.property.ownerId },
      data: { suspendedAt: new Date(), suspendedReason: motivo },
    })
  }

  await prisma.report.update({
    where: { id },
    data: {
      status: acao === 'ARQUIVAR' ? 'ARCHIVED' : 'ACTIONED',
      handledById: session.user.id,
      handledAt: new Date(),
      actionTaken: acao,
      handleNote: motivo,
    },
  })

  // Outras denúncias abertas do mesmo anúncio seguem a mesma decisão
  if (acao !== 'ARQUIVAR') {
    await prisma.report.updateMany({
      where: { propertyId: denuncia.propertyId, status: 'OPEN', id: { not: id } },
      data: { status: 'ACTIONED', handledById: session.user.id, handledAt: new Date(), actionTaken: acao, handleNote: motivo },
    })
  }

  registrar('DENUNCIA', {
    userId: session.user.id,
    ...origemDa(request as any),
    detail: `decisão ${acao} na denúncia ${id} (anúncio ${denuncia.propertyId}) · ${motivo}`,
  })

  revalidatePath('/admin/denuncias')
  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${denuncia.propertyId}`)

  return Response.json({ ok: true, acao })
}
