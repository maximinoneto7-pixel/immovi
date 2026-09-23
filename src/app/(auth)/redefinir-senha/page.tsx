'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import Logo from '@/components/common/Logo'
import { resetPassword } from '@/app/actions/password-reset'

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  )
}

function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await resetPassword(formData)
      if (result?.error) setError(result.error)
      else setDone(true)
    })
  }

  const invalidLink = !token || !email

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-indigo-900 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative text-center max-w-sm">
          <Logo tone="brand" size="lg" className="justify-center mb-8" />
          <h2 className="text-3xl font-bold mb-4">Quase lá</h2>
          <p className="text-indigo-100 leading-relaxed">
            Escolha uma nova senha para voltar a acessar sua conta com segurança.
          </p>
          <div className="mt-8 flex items-center gap-2 text-indigo-200 text-sm justify-center">
            <Shield className="w-4 h-4" />
            <span>Negocie direto, sem comissão obrigatória</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden mb-8" />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {invalidLink ? (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Este link de redefinição está incompleto ou já foi usado. Solicite um novo.
                </p>
                <Link href="/esqueci-senha" className="block text-center w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                  Solicitar novo link
                </Link>
              </>
            ) : done ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Senha redefinida!</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Sua senha foi alterada com sucesso. Já pode entrar com ela.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Ir para o login
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Criar nova senha</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Escolha uma senha forte com pelo menos 6 caracteres.
                </p>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="email" value={email} />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Salvando...' : 'Redefinir senha'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
