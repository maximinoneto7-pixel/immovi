'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Phone, Calendar, Send, Shield, AlertCircle } from 'lucide-react'

interface ContactFormProps {
  propertyId: string
  ownerId: string
  ownerName: string
  ownerPhone?: string | null
  isLoggedIn: boolean
}

export default function ContactForm({
  propertyId,
  ownerId,
  ownerName,
  ownerPhone,
  isLoggedIn,
}: ContactFormProps) {
  const [message, setMessage] = useState('')
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)

  const defaultMessages = [
    'Olá! Tenho interesse neste imóvel. Podemos conversar?',
    'Gostaria de agendar uma visita. Qual sua disponibilidade?',
    'Qual o valor mínimo para negociação?',
  ]

  const handleSend = async () => {
    if (!message.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, receiverId: ownerId, content: message }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setConversationId(data.conversationId ?? null)
        setSent(true)
        setMessage('')
      } else {
        // Ex.: mensagem bloqueada por conter telefone
        setError(data.error || 'Não foi possível enviar. Tente novamente.')
      }
    } catch {
      setError('Sem conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-indigo-500" />
          Entrar em contato
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Faça login para enviar mensagens diretamente ao anunciante.
        </p>
        <Link
          href={`/login?redirect=/imoveis/${propertyId}`}
          className="block w-full text-center py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
        >
          Entrar para contatar
        </Link>
        <Link
          href="/cadastro"
          className="block w-full text-center py-2.5 mt-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Criar conta gratuita
        </Link>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="font-semibold text-green-900 mb-1">Mensagem enviada!</div>
        <p className="text-sm text-green-700 mb-4">
          {ownerName} receberá sua mensagem e responderá em breve.
        </p>
        <Link
          href={conversationId ? `/mensagens/${conversationId}` : '/mensagens'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Abrir a conversa
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-indigo-500" />
        Contatar {ownerName}
      </h3>

      {/* Quick messages */}
      <div className="space-y-2 mb-3">
        {defaultMessages.map((msg) => (
          <button
            key={msg}
            onClick={() => setMessage(msg)}
            className="w-full text-left px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {msg}
          </button>
        ))}
      </div>

      <textarea
        ref={messageRef}
        value={message}
        onChange={(e) => { setMessage(e.target.value); if (error) setError('') }}
        placeholder="Ou escreva sua mensagem personalizada..."
        rows={3}
        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
      />

      {error && (
        <div className="flex items-start gap-2 p-3 mb-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!message.trim() || loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : 'Enviar mensagem'}
      </button>

      {ownerPhone && (
        <a
          href={`https://wa.me/55${ownerPhone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          <Phone className="w-4 h-4 text-green-500" />
          WhatsApp
        </a>
      )}

      {/* Preenche o pedido de visita e deixa pronto para enviar */}
      <button
        type="button"
        onClick={() => {
          setMessage('Gostaria de agendar uma visita. Qual sua disponibilidade?')
          messageRef.current?.focus()
        }}
        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-indigo-500" />
        Agendar visita
      </button>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        <span>Conversa protegida na plataforma</span>
      </div>
    </div>
  )
}
