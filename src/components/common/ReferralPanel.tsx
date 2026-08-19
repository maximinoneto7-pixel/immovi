'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle2, Share2, Gift, Users, Crown, Loader2 } from 'lucide-react'

export default function ReferralPanel() {
  const [data, setData] = useState<{ code: string; credits: number; indicados: number; link: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const copyLink = () => {
    if (!data?.link) return
    navigator.clipboard.writeText(data.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    if (!data?.link) return
    if (navigator.share) {
      await navigator.share({
        title: 'Immovi — Plataforma imobiliária',
        text: 'Encontre imóveis com transparência e humanidade. Use meu link:',
        url: data.link,
      })
    } else {
      copyLink()
    }
  }

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex justify-center">
      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
    </div>
  )

  if (!data) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="font-bold text-gray-900 flex items-center gap-2">
        <Gift className="w-5 h-5 text-amber-500" />
        Seu link de indicação
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Indicados', value: data.indicados, color: 'blue' },
          { icon: Crown, label: 'Créditos', value: data.credits, color: 'amber' },
          { icon: Gift, label: 'Código', value: data.code, color: 'green' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`p-3 rounded-xl text-center ${
            color === 'blue' ? 'bg-indigo-50' :
            color === 'amber' ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <Icon className={`w-5 h-5 mx-auto mb-1 ${
              color === 'blue' ? 'text-indigo-500' :
              color === 'amber' ? 'text-amber-500' : 'text-green-500'
            }`} />
            <div className="font-bold text-gray-900 text-sm">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Link */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Seu link exclusivo</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-mono truncate">
            {data.link}
          </div>
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0">
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Compartilhar */}
      <button onClick={share}
        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors">
        <Share2 className="w-4 h-4" />
        Compartilhar no WhatsApp / redes sociais
      </button>

      {data.credits > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Você tem <strong>{data.credits} mês{data.credits !== 1 ? 'es' : ''} grátis</strong> disponíveis!
          Eles serão aplicados na próxima renovação do seu plano.
        </div>
      )}
    </div>
  )
}
