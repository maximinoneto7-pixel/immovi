import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzePropertyDocument, getActiveProvider, PROVIDER_INFO } from '@/lib/document-ai'
import { sendDocumentVerifiedEmail } from '@/lib/email'

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const provider = getActiveProvider()
  if (provider === 'none') {
    return Response.json({
      error: 'NENHUMA_CHAVE',
      providers: PROVIDER_INFO,
    }, { status: 503 })
  }

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

    // Criar registro de documento pendente
    const doc = await prisma.propertyDocument.create({
      data: {
        propertyId,
        documentType: 'MATRICULA',
        status: 'PROCESSING',
        originalName: file.name,
      },
    })

    // Analisar com Claude IA
    const { analysis, ownerMatch, ownerMatchDetails } = await analyzePropertyDocument(
      base64,
      file.type,
      property.owner.name
    )

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
    console.error('Erro na análise de documento:', error)

    if (error.message?.includes('JSON')) {
      return Response.json({
        error: 'Não consegui extrair os dados. Envie uma foto mais nítida do documento.',
      }, { status: 422 })
    }

    return Response.json({
      error: 'Erro ao analisar o documento. Tente novamente.',
    }, { status: 500 })
  }
}
