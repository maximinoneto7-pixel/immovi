import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'
import { sendDocumentReviewedEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

// Conferência da matrícula pela equipe: aprova ou recusa com motivo.
// O arquivo é apagado assim que a decisão sai — ele já cumpriu o papel.
export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/admin/documentos/[id]'>
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { id } = await ctx.params
  const { aprovado, motivo } = await request.json()

  if (!aprovado && !(motivo || '').trim()) {
    return Response.json({ error: 'Escreva o motivo da recusa: ele vai para o anunciante.' }, { status: 400 })
  }

  const doc = await prisma.propertyDocument.findUnique({
    where: { id },
    include: {
      property: {
        select: { id: true, title: true, owner: { select: { id: true, name: true, email: true } } },
      },
    },
  })
  if (!doc) return Response.json({ error: 'Documento não encontrado.' }, { status: 404 })

  await prisma.propertyDocument.update({
    where: { id },
    data: {
      status: aprovado ? 'VERIFIED' : 'MISMATCH',
      ownerMatch: !!aprovado,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: (motivo || '').trim() || null,
      fileUrl: null,
    },
  })

  await prisma.property.update({
    where: { id: doc.propertyId },
    data: { verified: !!aprovado },
  })

  // O arquivo sai do armazenamento depois de conferido
  if (doc.fileUrl) await deleteFile(doc.fileUrl)

  const dono = doc.property.owner
  sendDocumentReviewedEmail(
    dono.email, dono.name, doc.property.title, doc.property.id, !!aprovado, motivo
  ).catch(console.error)

  revalidatePath('/admin/documentos')
  revalidatePath(`/imoveis/${doc.propertyId}`)
  revalidatePath('/imoveis')

  return Response.json({ ok: true, aprovado: !!aprovado })
}
