'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import CpfInput from '@/components/common/CpfInput'
import AvatarUpload from '@/components/perfil/AvatarUpload'
import { AlertCircle, Loader2 } from 'lucide-react'
import { STATES } from '@/lib/utils'

interface EditProfileFormProps {
  user: {
    name: string
    image: string | null
    phone: string | null
    bio: string | null
    cpf: string | null
    city: string | null
    state: string | null
    role: string
    creci: string | null
    creciState: string | null
    agencyName: string | null
    agencyPhone: string | null
    showActivity: boolean
    priceAlerts: boolean
  }
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const isAgent = user.role === 'AGENT'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (!result || 'error' in result) {
        setError(result?.error || 'Erro ao salvar perfil.')
        return
      }
      router.push('/perfil')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Dados pessoais</h2>

        <AvatarUpload name="image" initialUrl={user.image} fallbackLetter={user.name.charAt(0).toUpperCase()} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
          <input type="text" name="name" required defaultValue={user.name}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone/WhatsApp</label>
            <input type="tel" name="phone" defaultValue={user.phone || ''} placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CPF <span className="text-gray-400 font-normal">(necessário para assinar planos e receber pagamentos)</span>
            </label>
            <CpfInput defaultValue={user.cpf || ''} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
            <input type="text" name="city" defaultValue={user.city || ''} placeholder="Ex: Ivolândia"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <select name="state" defaultValue={user.state || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea name="bio" rows={3} defaultValue={user.bio || ''}
            placeholder="Conte um pouco sobre você..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      </div>

      {/* Privacidade do chat */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Privacidade</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="showActivity" value="true" defaultChecked={user.showActivity}
            className="w-4 h-4 mt-0.5 accent-indigo-600" />
          <span>
            <span className="block text-sm font-medium text-gray-800">Mostrar quando estou online e quando vi as mensagens</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Se desligar, os outros não veem seu “online agora”, “visto por último” nem “visualizada”, e você também deixa de ver o deles.
            </span>
          </span>
        </label>
      </div>

      {/* Avisos por e-mail e no celular */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Avisos</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="priceAlerts" value="true" defaultChecked={user.priceAlerts}
            className="w-4 h-4 mt-0.5 accent-indigo-600" />
          <span>
            <span className="block text-sm font-medium text-gray-800">Avisar quando baixar o preço de um imóvel que favoritei</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Você recebe por e-mail e, se tiver autorizado, também no celular. No máximo um aviso por imóvel por semana.
            </span>
          </span>
        </label>
      </div>

      {isAgent && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Dados de corretor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CRECI</label>
              <input type="text" name="creci" defaultValue={user.creci || ''} placeholder="Ex: 12345"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado do CRECI</label>
              <select name="creciState" defaultValue={user.creciState || ''}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da imobiliária</label>
              <input type="text" name="agencyName" defaultValue={user.agencyName || ''}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone da imobiliária</label>
              <input type="tel" name="agencyPhone" defaultValue={user.agencyPhone || ''}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar alterações'}
      </button>
    </form>
  )
}
