'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gift, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react'
import { resgatarTeste } from '@/app/actions/trial'

/** Oferta de abertura: 60 dias de Destaque para os 50 primeiros, sem cartão */
export default function TrialOffer({
  vagas,
  motivo,
  isLoggedIn,
}: {
  vagas: number
  /** Por que esta pessoa não pode resgatar; null se pode */
  motivo: string | null
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [ate, setAte] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (vagas === 0 && !ate) return null

  const ativar = () => {
    setErro('')
    startTransition(async () => {
      const r = await resgatarTeste()
      if (!r || 'error' in r) { setErro(r?.error || 'Não consegui ativar.'); return }
      setAte(r.ate)
      router.refresh()
    })
  }

  if (ate) {
    const quando = new Date(ate).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
    })
    return (
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-10">
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">Pronto — o Destaque é seu até {quando}</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Sem cartão e sem cobrança. Avisamos uma semana antes de acabar.
            </p>
          </div>
          <Link
            href="/imoveis/novo"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Publicar anúncio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 -mt-8 mb-10">
      <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-indigo-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-gray-900">60 dias de Destaque, de graça</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                {vagas} {vagas === 1 ? 'vaga' : 'vagas'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              Oferta de abertura para os 50 primeiros. Sem cartão, sem cobrança automática —
              no fim você decide se continua.
            </p>
          </div>

          {motivo ? (
            <span className="text-sm text-gray-500 sm:text-right sm:max-w-[12rem]">{motivo}</span>
          ) : (
            <button
              onClick={() => (isLoggedIn ? ativar() : router.push('/login?redirect=/planos'))}
              disabled={isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Começar os 60 dias grátis
            </button>
          )}
        </div>

        {erro && (
          <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}
      </div>
    </div>
  )
}
