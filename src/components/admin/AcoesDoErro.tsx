'use client'

import { useState, useTransition } from 'react'
import { marcarResolvido, apagarErro } from '@/app/actions/erros'
import { Check, Trash2, Loader2 } from 'lucide-react'

export default function AcoesDoErro({ id, resolvido }: { id: string; resolvido: boolean }) {
  const [pendente, startTransition] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {!resolvido && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(async () => { await marcarResolvido(id) })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-60"
        >
          {pendente ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Resolvido
        </button>
      )}

      {confirmando ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Apagar?</span>
          <button
            type="button"
            disabled={pendente}
            onClick={() => startTransition(async () => { await apagarErro(id) })}
            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Não
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Apagar
        </button>
      )}
    </div>
  )
}
