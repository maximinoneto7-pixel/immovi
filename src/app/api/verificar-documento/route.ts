import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzePropertyDocument, getActiveProvider } from '@/lib/document-ai'
import { sendDocumentVerifiedEmail, sendDocumentQueuedEmail } from '@/lib/email'
import { uploadFile } from '@/lib/storage'
import { avisarErro } from '@/lib/alerta-erro'
import { registrar, origemDa } from '@/lib/registro'

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const provider = getActiveProvider()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const propertyId = formData.get('propertyId') as string

    if (!file || !propertyId) {
      return Response.json({ error: 'Arquivo e ID do imóvel são obrigatórios.' }, { status: 400 })
    }

    // Verificar que o imóvel pertence ao usuário
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: session.user.id },
      include: { owner: { select: { name: true } } },
    })

    if (!property) {
      return Response.json({ error: 'Imóvel não encontrado.' }, { status: 404 })
    }

    // Tipos aceitos
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({
        error: 'Formato não suportado. Use PDF, JPG, PNG ou WebP.',
      }, { status: 400 })
    }

    // Limite de 4MB (a Vercel corta requisições acima de 4,5 MB)
    if (file.size > 4 * 1024 * 1024) {
      return Response.json({ error: 'Arquivo muito grande. Máximo 4MB.' }, { status: 400 })
    }

    // Converter para base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // O arquivo fica guardado até alguém conferir (endereço aleatório, só o admin abre)
    const guardado = await uploadFile(file, 'documentos').catch((err) => {
      console.error('[Documento] falha ao guardar o arquivo:', err.message)
      return null
    })

    // Criar registro de documento pendente
    const doc = await prisma.propertyDocument.create({
      data: {
        propertyId,
        documentType: 'MATRICULA',
        status: provider === 'none' ? 'PENDING' : 'PROCESSING',
        originalName: file.name,
        fileUrl: guardado?.url || null,
      },
    })

    registrar('DOCUMENTO_ENVIADO', {
      userId: session.user.id,
      ...origemDa(request as any),
      detail: `${propertyId} · ${file.name}`,
    })

    // Sem IA configurada: o documento entra na fila de conferência da equipe
    if (provider === 'none') {
      const dono = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      })
      if (dono) sendDocumentQueuedEmail(dono.email, dono.name, property.title).catch(console.error)

      return Response.json({
        success: true,
        documentId: doc.id,
        emAnalise: true,
        mensagem: 'Documento recebido. Nossa equipe vai conferir e o selo aparece no anúncio assim que for aprovado.',
      })
    }

    // A leitura automática é um extra, não um pedágio: se nenhum provedor configurado
    // lê este formato (a matrícula costuma vir em PDF) ou a análise falha, o documento
    // não se perde — fica na fila para alguém conferir à mão, que é o que valia antes
    // de existir IA. Mandar o cliente embora com erro é o único desfecho inaceitável.
    let leitura
    try {
      leitura = await analyzePropertyDocument(base64, file.type, property.owner.name)
    } catch (err) {
      await prisma.propertyDocument.update({
        where: { id: doc.id },
        data: { status: 'PENDING', aiAnalysis: `leitura automática indisponível: ${(err as Error).message}` },
      })

      const dono = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      })
      if (dono) sendDocumentQueuedEmail(dono.email, dono.name, property.title).catch(console.error)

      return Response.json({
        success: true,
        documentId: doc.id,
        emAnalise: true,
        mensagem: 'Documento recebido. Nossa equipe vai conferir e o selo aparece no anúncio assim que for aprovado.',
      })
    }

    const { analysis, ownerMatch, ownerMatchDetails } = leitura

    // Atualizar documento com resultado
    const updatedDoc = await prisma.propertyDocument.update({
      where: { id: doc.id },
      data: {
        status: ownerMatch ? 'VERIFIED' : 'MISMATCH',
        extractedOwners: analysis.owners.join(', '),
        extractedArea: analysis.area,
        extractedAddress: analysis.address,
        extractedRegNumber: analysis.registrationNumber,
        extractedLiens: analysis.liens.join('; ') || null,
        aiAnalysis: JSON.stringify({ analysis, ownerMatchDetails }),
        ownerMatch,
        updatedAt: new Date(),
      },
    })

    // Se o proprietário confere, marcar imóvel como verificado
    if (ownerMatch && analysis.isValid) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { verified: true },
      })
    }

    // Notificação por e-mail do resultado
    const owner = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })
    if (owner) {
      sendDocumentVerifiedEmail(
        owner.email, owner.name, property.title, propertyId,
        ownerMatch && analysis.isValid, analysis.owners
      ).catch(console.error)
    }

    return Response.json({
      success: true,
      documentId: updatedDoc.id,
      verified: ownerMatch && analysis.isValid,
      analysis: {
        owners: analysis.owners,
        registrationNumber: analysis.registrationNumber,
        area: analysis.area,
        address: analysis.address,
        documentType: analysis.documentType,
        liens: analysis.liens,
        confidence: analysis.confidence,
        ownerMatch,
        ownerMatchDetails,
        observations: analysis.observations,
        rawSummary: analysis.rawSummary,
        isValid: analysis.isValid,
      },
    })
  } catch (error: any) {
    avisarErro('verificação de documento', error)

    return Response.json({
      error: 'Não consegui receber o documento agora. Tente novamente em instantes.',
    }, { status: 500 })
  }
}
