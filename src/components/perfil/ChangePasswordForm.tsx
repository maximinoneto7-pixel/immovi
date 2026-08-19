'use client'

import { useState, useTransition } from 'react'
import { changePassword } from '@/app/actions/profile'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await changePassword(formData)
      if (!result || 'error' in result) {
        setError(result?.error || 'Erro ao trocar senha.')
        return
      }
      setSuccess(true)
      e.currentTarget.reset()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">
        {hasPassword ? 'Trocar senha' : 'Criar senha'}
      </h2>
      {!hasPassword && (
        <p className="text-xs text-gray-500 -mt-2">
          Sua conta foi criada com login do Google — defina uma senha para também poder entrar com e-mail e senha.
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Senha atualizada com sucesso.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha atual</label>
            <input type="password" name="currentPassword" required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
            <input type="password" name="newPassword" required minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
            <input type="password" name="confirmPassword" required minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button type="submit" disabled={isPending}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 flex items-center gap-2">
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : hasPassword ? 'Trocar senha' : 'Criar senha'}
        </button>
      </form>
    </div>
  )
}
