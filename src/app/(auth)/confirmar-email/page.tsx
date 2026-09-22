import Link from 'next/link'
import { Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import Logo from '@/components/common/Logo'
import { confirmEmailToken } from '@/lib/email-verification'
import ResendVerification from '@/components/auth/ResendVerification'

export const metadata = { title: 'Confirme seu e-mail | Immovi' }

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams

  // Com token: confirma na hora. Sem token: tela de "enviamos o link".
  const result = token ? await confirmEmailToken(token) : null
  const confirmed = result && 'email' in result
  const failed = result && 'error' in result

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative text-center max-w-sm">
          <Logo tone="brand" size="lg" className="justify-center mb-8" />
          <h2 className="text-3xl font-bold mb-4">Falta um toque</h2>
          <p className="text-indigo-100 leading-relaxed">
            Confirmar o e-mail garante que ninguém publique anúncios ou converse em nome de outra pessoa.
          </p>
          <div className="mt-8 flex items-center gap-2 text-indigo-200 text-sm justify-center">
            <Shield className="w-4 h-4" />
            <span>Plataforma segura e verificada</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden mb-8" />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {confirmed ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">E-mail confirmado</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Tudo certo com <strong className="text-gray-700">{(result as { email: string }).email}</strong>.
                  Você já pode publicar anúncios e conversar pela Immovi.
                </p>
                <Link href="/login" className="block text-center w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                  Entrar na minha conta
                </Link>
              </>
            ) : failed ? (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
                <p className="text-gray-500 text-sm mb-6">{(result as { error: string }).error}</p>
                <ResendVerification email={email} />
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirme seu e-mail</h1>
                <p className="text-gray-500 text-sm mb-6">
                  {email ? (
                    <>Enviamos um link para <strong className="text-gray-700">{email}</strong>. O link vale por 24 horas.</>
                  ) : (
                    <>Enviamos um link de confirmação para o seu e-mail. Ele vale por 24 horas.</>
                  )}
                </p>
                <ResendVerification email={email} />
                <p className="text-xs text-gray-400 mt-4">
                  Não chegou? Veja o lixo eletrônico. Se o endereço estiver errado, crie a conta de novo com o e-mail correto.
                </p>
                <Link href="/login" className="block text-center text-sm text-indigo-600 font-medium mt-4 hover:underline">
                  Ir para o login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
