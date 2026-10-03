'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Loader2 } from 'lucide-react'
import { aceitarTermos } from '@/app/actions/termos'

/** Aviso de Termos atualizados, com o aceite em um clique */
export default function AceiteDosTermos({ data }: { data: string }) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  // O cabeçalho só reconsulta a cada minuto; sem isto o aviso ficaria na tela
  // depois de aceito, como se o clique não tivesse funcionado.
  const [aceito, setAceito] = useState(false)
  const [isPending, startTransition] = useTransition()

  const aceitar = () => {
    setErro('')
    startTransition(async () => {
      const r = await aceitarTermos()
      if (r?.error) { setErro(r.error); return }
      setAceito(true)
      router.refresh()
    })
  }

  if (aceito) return null

  return (
    <div className="bg-indigo-50 border-b border-indigo-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-indigo-900">
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 min-w-[12rem]">
          Os Termos de Uso mudaram em {data}.{' '}
          <Link href="/termos" className="underline font-medium">Ler o que mudou</Link>
        </span>
        {erro && <span className="text-red-700">{erro}</span>}
        <button
          onClick={aceitar}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Li e aceito
        </button>
      </div>
    </div>
  )
}
