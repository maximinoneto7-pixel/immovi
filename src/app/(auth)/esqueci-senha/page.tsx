'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Home, Mail, Shield, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import OAuthButtons from '@/components/common/OAuthButtons'
import { requestPasswordReset } from '@/app/actions/password-reset'

export default function EsqueciSenhaPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (result?.error) setError(result.error)
      else setSent(true)
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative text-center max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Home className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">Immovi</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Vamos recuperar seu acesso</h2>
          <p className="text-indigo-100 leading-relaxed">
            Acontece com todo mundo. Em poucos passos você volta a acessar sua conta com segurança.
          </p>
          <div className="mt-8 flex items-center gap-2 text-indigo-200 text-sm justify-center">
            <Shield className="w-4 h-4" />
            <span>Plataforma segura e verificada</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#f7f9fc]">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Immo<span className="text-indigo-600">vi</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar para o login
            </Link>

            {sent ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h1>
                <p className="text-gray-500 text-sm">
                  Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.
                  Ele expira em 1 hora. Não esqueça de checar a caixa de spam.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Esqueceu sua senha?</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Informe seu e-mail e enviaremos um link para você criar uma nova senha.
                </p>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>

                <div className="mt-5">
                  <OAuthButtons callbackUrl="/" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
