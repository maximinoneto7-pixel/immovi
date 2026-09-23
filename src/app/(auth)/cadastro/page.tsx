'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import {
  Home, Mail, Lock, Eye, EyeOff, User, Phone, Shield,
  AlertCircle, CheckCircle2, Building2, UserCheck, ChevronRight,
} from 'lucide-react'
import { registerUser } from '@/app/actions/auth'
import OAuthButtons from '@/components/common/OAuthButtons'
import Logo from '@/components/common/Logo'
import { cn } from '@/lib/utils'

type ProfileType = 'BUYER' | 'SELLER' | 'AGENT'

const PROFILES = [
  {
    id: 'BUYER' as ProfileType,
    icon: User,
    label: 'Comprador / Locatário',
    desc: 'Quero encontrar imóveis para comprar ou alugar',
    color: 'blue',
    requirements: ['Nome completo', 'E-mail válido', 'Telefone (opcional)', 'Senha'],
  },
  {
    id: 'SELLER' as ProfileType,
    icon: Home,
    label: 'Vendedor Particular',
    desc: 'Sou proprietário e quero anunciar meu imóvel diretamente',
    color: 'green',
    requirements: ['Nome completo', 'CPF', 'E-mail válido', 'Telefone', 'Senha'],
  },
  {
    id: 'AGENT' as ProfileType,
    icon: Building2,
    label: 'Corretor de Imóveis',
    desc: 'Sou corretor credenciado com CRECI ativo',
    color: 'violet',
    requirements: ['Nome completo', 'CPF', 'Número do CRECI', 'Estado do CRECI', 'E-mail profissional', 'Telefone', 'Senha'],
  },
]

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'choose' | 'form'>('choose')
  const [profile, setProfile] = useState<ProfileType>('BUYER')

  const [state, action, isPending] = useActionState(
    async (_: unknown, formData: FormData) => registerUser(formData),
    null
  )

  const selectedProfile = PROFILES.find((p) => p.id === profile)!

  const colorMap = {
    blue:   { bg: 'bg-indigo-50 border-indigo-300', icon: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    green:  { bg: 'bg-green-50 border-green-300', icon: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
    violet: { bg: 'bg-violet-50 border-violet-300', icon: 'text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700' },
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-indigo-900 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="relative text-center max-w-sm">
          <Logo tone="brand" size="lg" className="justify-center mb-8" />
          <h2 className="text-3xl font-bold mb-4">
            {step === 'choose' ? 'Qual é o seu perfil?' : `Cadastro de ${selectedProfile.label}`}
          </h2>
          <p className="text-indigo-100 leading-relaxed mb-8">
            {step === 'choose'
              ? 'Criamos uma experiência personalizada para compradores, vendedores e corretores.'
              : 'Preencha seus dados para criar sua conta com segurança.'}
          </p>
          {step === 'form' && (
            <div className="text-left">
              <p className="text-indigo-200 text-sm font-semibold mb-3">Documentos necessários:</p>
              {selectedProfile.requirements.map((r) => (
                <div key={r} className="flex items-center gap-2 text-indigo-100 text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo mobile */}
          <Logo className="lg:hidden mb-8" />

          {step === 'choose' ? (
            /* STEP 1: Escolha de perfil */
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Criar conta</h1>
              <p className="text-gray-500 text-sm mb-6">
                Já tem conta?{' '}
                <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Fazer login</Link>
              </p>

              <div className="space-y-3 mb-6">
                {PROFILES.map((p) => {
                  const c = colorMap[p.color as keyof typeof colorMap]
                  const isSelected = profile === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProfile(p.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                        isSelected ? `${c.bg} border-current` : 'bg-white border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        isSelected ? c.bg : 'bg-gray-100')}>
                        <p.icon className={cn('w-6 h-6', isSelected ? c.icon : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{p.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                      </div>
                      {isSelected && <CheckCircle2 className={cn('w-5 h-5 flex-shrink-0', c.icon)} />}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Continuar como {selectedProfile.label}
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="mt-5">
                <OAuthButtons callbackUrl="/" />
              </div>
            </div>
          ) : (
            /* STEP 2: Formulário de cadastro */
            <div>
              <button onClick={() => setStep('choose')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{selectedProfile.label}</h1>
              <p className="text-gray-500 text-sm mb-5">
                Já tem conta?{' '}
                <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Fazer login</Link>
              </p>

              {state?.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {state.error}
                </div>
              )}

              <form action={action} className="space-y-3">
                <input type="hidden" name="role" value={profile} />

                {/* Campos comuns */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="name" required placeholder="Nome completo *"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" name="email" required placeholder="E-mail *"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" name="phone" placeholder={`Telefone ${profile !== 'BUYER' ? '*' : '(opcional)'}`}
                    required={profile !== 'BUYER'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* CPF — obrigatório para vendedor e corretor */}
                {(profile === 'SELLER' || profile === 'AGENT') && (
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="cpf" required placeholder="CPF *  (000.000.000-00)"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                )}

                {/* CRECI — obrigatório para corretor */}
                {profile === 'AGENT' && (
                  <>
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-violet-800 text-sm font-semibold">
                        <UserCheck className="w-4 h-4" />
                        Dados do CRECI (obrigatório para corretores)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" name="creci" required placeholder="Nº CRECI *"
                          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
                        <input type="text" name="creciState" required maxLength={2} placeholder="UF *  (SP)"
                          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
                      </div>
                      <input type="text" name="agencyName" placeholder="Nome da imobiliária (opcional)"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        O CRECI será verificado junto ao COFECI. Cadastros com CRECI inválido ou suspenso serão cancelados.
                      </p>
                    </div>
                  </>
                )}

                {/* Senha */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} name="password" required minLength={6}
                    placeholder="Senha * (mínimo 6 caracteres)"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Termos diferenciados por perfil */}
                {profile === 'SELLER' && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl">
                    <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700">
                      Como vendedor particular, você declara ser o legítimo proprietário ou ter poderes para anunciar o imóvel.
                      Anúncios fraudulentos resultam em banimento e podem ser reportados às autoridades.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-1">
                  <input type="checkbox" id="terms" required className="mt-0.5 w-4 h-4 accent-indigo-600" />
                  <label htmlFor="terms" className="text-xs text-gray-500">
                    Li e aceito os <Link href="/termos" className="text-indigo-600 underline">Termos de Uso</Link>{' '}
                    e a <Link href="/privacidade" className="text-indigo-600 underline">Política de Privacidade</Link>
                  </label>
                </div>

                <button type="submit" disabled={isPending}
                  className={cn('w-full py-3.5 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 mt-2',
                    colorMap[selectedProfile.color as keyof typeof colorMap].btn)}>
                  {isPending ? 'Criando conta...' : `Criar conta de ${selectedProfile.label}`}
                </button>
              </form>

              <div className="mt-5">
                <OAuthButtons callbackUrl="/" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
