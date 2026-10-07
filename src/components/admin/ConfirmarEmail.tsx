'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MailCheck, Loader2 } from 'lucide-react'
import { confirmarEmailNaMao } from '@/app/actions/email-admin'

/** Destrava quem não recebeu o e-mail de confirmação */
export default function ConfirmarEmail({ userId }: { userId: string }) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const confirmar = () => {
    setErro('')
    startTransition(async () => {
      const r = await confirmarEmailNaMao(userId)
      if (r?.error) { setErro(r.error); return }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={confirmar}
        disabled={isPending}
        title="Marcar o e-mail como confirmado, para esta pessoa poder publicar"
        className="inline-flex items-center gap-1 px-2.5 py-1 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
        Confirmar e-mail
      </button>
      {erro && <span className="text-[11px] text-red-600">{erro}</span>}
    </div>
  )
}
