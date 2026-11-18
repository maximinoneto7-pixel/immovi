import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/lib/auth'
import { avisarErro } from '@/lib/alerta-erro'

/**
 * Envio de vídeo do imóvel.
 *
 * O arquivo não passa por aqui: a Vercel recusa qualquer requisição ao servidor
 * acima de 4,5 MB, e meio minuto de vídeo de celular pesa bem mais. Esta rota só
 * assina a permissão para o navegador mandar o arquivo direto ao armazenamento.
 */

/** Teto de tamanho. A duração (1 minuto) é conferida no navegador, antes de subir. */
const MAXIMO = 100 * 1024 * 1024

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const resposta = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth()
        if (!session?.user?.id) throw new Error('Entre na sua conta para enviar o vídeo.')

        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
          maximumSizeInBytes: MAXIMO,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        }
      },
      onUploadCompleted: async () => {
        // O endereço do arquivo volta para o navegador e é gravado junto com o
        // anúncio; não há nada a fazer aqui.
      },
    })

    return Response.json(resposta)
  } catch (err) {
    const motivo = (err as Error).message || ''

    // Falta de sessão é recusa esperada e a mensagem já é para a pessoa ler.
    // Qualquer outra coisa é problema nosso: vai para /admin/erros com o motivo
    // técnico, e quem está anunciando recebe uma frase que faz sentido.
    if (/conta/i.test(motivo)) {
      return Response.json({ error: motivo }, { status: 401 })
    }

    await avisarErro('envio de vídeo do imóvel', err).catch(() => {})
    return Response.json(
      { error: 'Não consegui preparar o envio do vídeo agora. Já fui avisado do problema.' },
      { status: 500 }
    )
  }
}
