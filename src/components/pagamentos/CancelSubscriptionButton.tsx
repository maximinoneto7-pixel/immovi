'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSubscription } from '@/app/actions/subscription'
import { AlertCircle, Loader2, XCircle } from 'lucide-react'

export default function CancelSubscriptionButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleCancel = () => {
    setError('')
    startTransition(async () => {
      const result = await cancelSubscription()
      if (!result || 'error' in result) {
        setError(result?.error || 'Erro ao cancelar assinatura.')
        return
      }
      router.refresh()
    })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Cancelar assinatura
      </button>
    )
  }

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <p className="text-sm text-red-800">
        Tem certeza? A renovação automática será interrompida, mas seu plano continua ativo até o fim do período já pago.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, cancelar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
