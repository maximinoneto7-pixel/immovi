'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Calendar, Send, Shield, AlertCircle } from 'lucide-react'

import ScheduleVisit, { type DiaDisponivel } from '@/components/imoveis/ScheduleVisit'
import { deixarRecado } from '@/app/actions/recado'

interface ContactFormProps {
  propertyId: string
  ownerId: string
  ownerName: string
  isLoggedIn: boolean
  /** Dias liberados pelo anunciante; vazio mantém o pedido escrito de antes */
  diasDeVisita?: DiaDisponivel[]
  recadoDeVisita?: string | null
  /** Link pronto do WhatsApp do anunciante; null quando ele não liberou o número */
  linkWhatsapp?: string | null
}

export default function ContactForm({
  propertyId,
  ownerId,
  ownerName,
  isLoggedIn,
  diasDeVisita,
  recadoDeVisita,
  linkWhatsapp,
}: ContactFormProps) {
  const [message, setMessage] = useState('')
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Recado de quem não tem conta
  const [recadoEnviado, setRecadoEnviado] = useState(false)
  const [enviandoRecado, setEnviandoRecado] = useState(false)
  const [erroRecado, setErroRecado] = useState('')
  const [telefone, setTelefone] = useState('')
  const primeiroNome = ownerName.split(' ')[0]

  const mascararTelefone = (valor: string) => {
    const d = valor.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const enviarRecado = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEnviandoRecado(true)
    setErroRecado('')
    const dados = new FormData(e.currentTarget)
    dados.set('propertyId', propertyId)
    const r = await deixarRecado(dados)
    setEnviandoRecado(false)
    if ('error' in r) {
      setErroRecado(r.error ?? 'Não consegui enviar agora. Tente de novo em instantes.')
      return
    }
    setRecadoEnviado(true)
  }

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
        // Ex.: e-mail ainda não confirmado, ou anúncio fora do ar
        setError(data.error || 'Não foi possível enviar. Tente novamente.')
      }
    } catch {
      setError('Sem conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // O número nunca é escrito na página: sai daqui só o link já montado no servidor
  const BotaoWhatsapp = () =>
    linkWhatsapp ? (
      <a
        href={linkWhatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#1da851] transition-colors text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        Falar no WhatsApp
      </a>
    ) : null

  if (!isLoggedIn) {
    if (recadoEnviado) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Recado enviado</h3>
              <p className="text-sm text-gray-500 mt-1">
                {primeiroNome} recebeu seu telefone agora.
              </p>
            </div>
          </div>
          {linkWhatsapp && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Se preferir, fale você mesmo:</p>
              <BotaoWhatsapp />
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-indigo-500" />
          Entrar em contato
        </h3>

        {linkWhatsapp && (
          <div className="mb-4">
            <BotaoWhatsapp />
            <p className="text-center text-xs text-gray-400 mt-2">ou deixe seu telefone</p>
          </div>
        )}

        <form onSubmit={enviarRecado} className="space-y-2.5">
          <p className="text-sm text-gray-500">
            Deixe seu nome e telefone — {primeiroNome} entra em contato. Não precisa criar conta.
          </p>
          <input
            type="text" name="name" required placeholder="Seu nome" autoComplete="name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="tel" name="phone" required placeholder="(00) 00000-0000" autoComplete="tel"
            value={telefone} onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            name="message" rows={2} placeholder="Mensagem (opcional)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {/* Campo invisível: robô preenche, gente não */}
          <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          {erroRecado && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {erroRecado}
            </div>
          )}

          <button
            type="submit" disabled={enviandoRecado}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-60"
          >
            {enviandoRecado ? 'Enviando...' : 'Enviar meu telefone'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-3">
          Prefere o chat da Immovi?{' '}
          <Link href={`/login?redirect=/imoveis/${propertyId}`} className="text-indigo-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
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

      {linkWhatsapp && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <BotaoWhatsapp />
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Ou mande uma mensagem pelo chat da Immovi, que fica registrada aqui.
          </p>
        </div>
      )}

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

      {/* Com horários marcados, o botão agenda de verdade; sem eles, pede pelo chat */}
      <div className="mt-2">
        {diasDeVisita && diasDeVisita.length > 0 ? (
          <ScheduleVisit
            propertyId={propertyId}
            dias={diasDeVisita}
            recado={recadoDeVisita}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setMessage('Gostaria de agendar uma visita. Qual sua disponibilidade?')
              messageRef.current?.focus()
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            Agendar visita
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        <span>Conversa protegida na plataforma</span>
      </div>
    </div>
  )
}
