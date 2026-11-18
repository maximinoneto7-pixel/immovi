export function getVideoEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`

  return null
}

/**
 * Vídeo enviado pelo anunciante, em vez de link de plataforma.
 *
 * Quem grava com o celular manda o arquivo; ele vai direto do aparelho para o
 * armazenamento e chega aqui como endereço de arquivo, não de página. Esse toca
 * dentro do anúncio, sem moldura de terceiro.
 */
export function ehArquivoDeVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}
