'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { encerrarConta } from '@/app/actions/account'

/** Encerramento de conta: fica fora do formulário do perfil, para ninguém apertar sem querer */
export default function CloseAccount({ temSenha }: { temSenha: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErro('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await encerrarConta(formData)
      if (r?.error) setErro(r.error)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
      <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Encerrar minha conta</h2>

      <p className="text-sm text-gray-600 leading-relaxed">
        Seus anúncios saem do ar e seu perfil deixa de existir. Continuam arquivados, fora do site e à vista
        apenas da administração, os dados que sustentam contratos e pagamentos — nome e CPF —, conforme a{' '}
        <Link href="/privacidade" className="text-indigo-600 font-medium hover:underline">política de privacidade</Link>.
        Se você só quer uma pausa, pode pausar cada anúncio em “Meus anúncios”.
      </p>

      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Quero encerrar minha conta
        </button>
      ) : (
        <form onSubmit={enviar} className="space-y-3 pt-1">
          {erro && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          {temSenha && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sua senha</label>
              <input
                type="password"
                name="senha"
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Escreva <strong>ENCERRAR</strong> para confirmar
            </label>
            <input
              type="text"
              name="confirmacao"
              placeholder="ENCERRAR"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Encerrar definitivamente
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
