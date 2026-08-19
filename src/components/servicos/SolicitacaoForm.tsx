'use client'

import { useState } from 'react'
import { Handshake, CheckCircle2, Loader2 } from 'lucide-react'

export default function SolicitacaoForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Solicitação enviada!</h3>
        <p className="text-gray-500 text-sm">
          Um de nossos parceiros especializados entrará em contato em até <strong>24 horas</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
            <input type="text" required placeholder="Seu nome"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone / WhatsApp *</label>
            <input type="tel" required placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
          <input type="email" required placeholder="seu@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Serviço desejado *</label>
          <select required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Selecione o serviço</option>
            <option value="vistoria">Vistoria Profissional</option>
            <option value="seguro">Seguro Imobiliário</option>
            <option value="juridico">Assessoria Jurídica</option>
            <option value="avaliacao">Avaliação de Imóvel</option>
            <option value="financiamento">Financiamento</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade do imóvel</label>
          <input type="text" placeholder="Ex: São Paulo, SP"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem (opcional)</label>
          <textarea rows={3} placeholder="Descreva brevemente o que você precisa..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
            : <><Handshake className="w-5 h-5" /> Enviar solicitação</>
          }
        </button>

        <p className="text-center text-xs text-gray-400">
          Resposta em até 24h • Sem compromisso • Gratuito
        </p>
      </form>
    </div>
  )
}
