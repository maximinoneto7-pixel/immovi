'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Video, Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { ehArquivoDeVideo } from '@/lib/video'

const SEGUNDOS_MAX = 60
const TAMANHO_MAX = 100 * 1024 * 1024

/** Lê a duração do arquivo sem enviar nada — o navegador já sabe antes de subir */
function duracaoDoVideo(arquivo: File): Promise<number> {
  return new Promise((resolve) => {
    const endereco = URL.createObjectURL(arquivo)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(endereco)
      resolve(v.duration || 0)
    }
    // Arquivo que o navegador não entende: deixa o servidor recusar pelo tipo
    v.onerror = () => {
      URL.revokeObjectURL(endereco)
      resolve(0)
    }
    v.src = endereco
  })
}

function emMegas(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

/**
 * Vídeo curto do imóvel, enviado do próprio celular.
 *
 * O arquivo vai direto do aparelho para o armazenamento, sem passar pelo nosso
 * servidor — a Vercel recusa requisição acima de 4,5 MB e meio minuto de vídeo
 * pesa bem mais. Duração e tamanho são conferidos aqui, antes de gastar a
 * internet de quem está anunciando.
 */
export default function EnvioDeVideo({
  valor,
  onChange,
}: {
  valor: string
  onChange: (url: string) => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const temArquivo = !!valor && ehArquivoDeVideo(valor)

  const escolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setErro('')

    if (arquivo.size > TAMANHO_MAX) {
      setErro(`O vídeo tem ${emMegas(arquivo.size)} e o limite é ${emMegas(TAMANHO_MAX)}. Grave um trecho menor.`)
      return
    }

    const segundos = await duracaoDoVideo(arquivo)
    if (segundos > SEGUNDOS_MAX + 1) {
      setErro(`O vídeo tem ${Math.round(segundos)} segundos e o limite é ${SEGUNDOS_MAX}. Um minuto mostrando o essencial rende mais do que um passeio longo.`)
      return
    }

    setEnviando(true)
    setProgresso(0)
    try {
      const enviado = await upload(arquivo.name, arquivo, {
        access: 'public',
        handleUploadUrl: '/api/upload/video',
        onUploadProgress: ({ percentage }) => setProgresso(Math.round(percentage)),
      })
      onChange(enviado.url)
    } catch (falha) {
      setErro((falha as Error).message || 'Não consegui enviar o vídeo. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Vídeo do imóvel <span className="text-gray-400 font-normal">(opcional, até 1 minuto)</span>
      </label>

      {temArquivo ? (
        <div className="space-y-2">
          <video
            src={valor}
            controls
            preload="metadata"
            className="w-full rounded-xl bg-black aspect-video"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600"
          >
            <X className="w-4 h-4" /> Remover vídeo
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={escolher}
            className="hidden"
          />
          <button
            type="button"
            disabled={enviando}
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-60"
          >
            {enviando ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm font-medium">Enviando… {progresso}%</span>
                <span className="w-2/3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <span className="block h-full bg-indigo-600 transition-all" style={{ width: `${progresso}%` }} />
                </span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Enviar vídeo do celular</span>
                <span className="text-xs text-gray-400">MP4, MOV ou WebM · até 1 minuto</span>
              </>
            )}
          </button>
        </>
      )}

      {erro && (
        <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-gray-400 mt-2">
        <Video className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Grave na horizontal, mostrando a fachada, a sala e o quintal. O vídeo toca
        dentro do anúncio, sem a pessoa sair do site.
      </p>
    </div>
  )
}
