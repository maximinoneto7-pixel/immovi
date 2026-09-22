'use client'

import { useState, useTransition } from 'react'
import { Loader2, Mail, Check } from 'lucide-react'
import { resendVerification } from '@/app/actions/auth'

/** Botão "Reenviar o link" da confirmação de e-mail */
export default function ResendVerification({ email, compact }: { email?: string; compact?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [typed, setTyped] = useState(email || '')

  const send = () => {
    startTransition(async () => {
      await resendVerification(typed)
      setSent(true)
    })
  }

  if (sent) {
    return (
      <p className={`flex items-center gap-2 text-sm font-medium text-green-700 ${compact ? '' : 'py-3'}`}>
        <Check className="w-4 h-4" />
        Link enviado. Confira sua caixa de entrada.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {!email && (
        <input
          type="email"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Seu e-mail"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
      <button
        onClick={send}
        disabled={isPending || !typed.trim()}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 text-white text-xs font-semibold rounded-lg hover:bg-amber-900 transition-colors disabled:opacity-60'
            : 'w-full flex items-center justify-center gap-2 py-3 border border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-60'
        }
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {compact ? 'Enviar link' : 'Reenviar o link'}
      </button>
    </div>
  )
}
