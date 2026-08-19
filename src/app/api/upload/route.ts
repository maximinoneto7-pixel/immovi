import { auth } from '@/lib/auth'
import { uploadMultiple, validateFile } from '@/lib/storage'

export const maxDuration = 30

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const folder = (formData.get('folder') as string) || 'imoveis'

    if (!files.length) {
      return Response.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (files.length > 20) {
      return Response.json({ error: 'Máximo 20 fotos por vez.' }, { status: 400 })
    }

    // Valida todos antes de fazer upload
    for (const file of files) {
      const err = validateFile(file)
      if (err) return Response.json({ error: err }, { status: 400 })
    }

    const results = await uploadMultiple(files, folder)

    return Response.json({
      success: true,
      files: results.map(r => ({
        url: r.url,
        filename: r.filename,
        size: r.size,
        provider: r.provider,
      })),
    })
  } catch (err: any) {
    console.error('Erro no upload:', err)
    return Response.json({ error: err.message || 'Erro ao fazer upload.' }, { status: 500 })
  }
}
