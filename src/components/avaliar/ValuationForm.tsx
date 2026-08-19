'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { requestValuation } from '@/app/actions/valuation'
import { PROPERTY_TYPES, STATES } from '@/lib/utils'
import { AlertCircle, Loader2, TrendingUp, Sparkles } from 'lucide-react'

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ValuationForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [listingType, setListingType] = useState('SALE')
  const [result, setResult] = useState<{ estimateMin: number; estimateMax: number; confidence: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await requestValuation(formData)
      if (!res || 'error' in res) {
        setError(res?.error || 'Erro ao calcular a estimativa.')
        return
      }
      setResult(res)
    })
  }

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-7 h-7 text-indigo-600" />
        </div>
        <p className="text-sm text-gray-500 mb-2">Estimativa de valor</p>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatBRL(result.estimateMin)} – {formatBRL(result.estimateMax)}
        </div>
        <p className="text-xs text-gray-400 mb-6">
          {result.confidence === 'local' && 'Baseado em anúncios ativos na mesma cidade.'}
          {result.confidence === 'regional' && 'Baseado em anúncios ativos no mesmo estado.'}
          {result.confidence === 'baseline' && 'Estimativa aproximada — ainda não há anúncios suficientes na região para comparação direta.'}
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
          <p className="text-xs text-amber-800">
            <strong>Esta é uma estimativa automática</strong>, não substitui uma avaliação profissional.
            Um de nossos especialistas foi notificado e pode entrar em contato para refinar esse valor.
          </p>
        </div>
        <Link href="/imoveis/novo" className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <Sparkles className="w-4 h-4" /> Anunciar este imóvel agora
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome *</label>
            <input type="text" name="name" required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
            <input type="email" name="email" required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone/WhatsApp</label>
          <input type="tel" name="phone" placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de imóvel *</label>
            <select name="type" required defaultValue="HOUSE"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Finalidade *</label>
            <select name="listingType" required value={listingType} onChange={(e) => setListingType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="SALE">Venda</option>
              <option value="RENT">Aluguel</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade *</label>
            <input type="text" name="city" required placeholder="Ex: Ivolândia"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado *</label>
            <select name="state" required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
          <input type="text" name="neighborhood"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Área total (m²) *</label>
            <input type="number" name="area" required min={1} placeholder="Ex: 120"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quartos</label>
            <input type="number" name="bedrooms" min={0} placeholder="Ex: 3"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <button type="submit" disabled={isPending}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculando...</> : 'Calcular estimativa'}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Ao continuar, você concorda com nossa{' '}
          <Link href="/privacidade" className="text-indigo-600 hover:underline">Política de Privacidade</Link>.
        </p>
      </form>
    </div>
  )
}
