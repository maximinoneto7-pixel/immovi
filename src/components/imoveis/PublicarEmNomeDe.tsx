'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, UserCheck, X, Loader2 } from 'lucide-react'

type Conta = {
  id: string
  name: string
  email: string
  role: string
  city: string | null
  state: string | null
}

const PAPEL: Record<string, string> = {
  BUYER: 'Comprador', SELLER: 'Vendedor', AGENT: 'Corretor', ADMIN: 'Administrador',
}

/**
 * Escolher em nome de quem publicar. Só aparece para administrador.
 *
 * O dono do anúncio precisa ser a pessoa do imóvel, não quem digitou: é ele que
 * recebe os contatos e é só ele que edita depois. Sem isto, cadastrar pelo amigo
 * exigia entrar na conta dele.
 */
export default function PublicarEmNomeDe({ meuNome }: { meuNome: string }) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<Conta[]>([])
  const [buscando, setBuscando] = useState(false)
  const [escolhido, setEscolhido] = useState<Conta | null>(null)
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (escolhido || termo.trim().length < 2) {
      setResultados([])
      return
    }
    setBuscando(true)
    // Espera a pessoa parar de digitar antes de consultar
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/usuarios/buscar?q=${encodeURIComponent(termo.trim())}`)
        const dados = await res.json().catch(() => ({}))
        setResultados(dados.usuarios || [])
        setAberto(true)
      } finally {
        setBuscando(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [termo, escolhido])

  // Fecha a lista ao clicar fora
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3 mb-4">
        De quem é este imóvel
      </h2>

      <input type="hidden" name="donoId" value={escolhido?.id ?? ''} />

      {escolhido ? (
        <div className="flex items-start justify-between gap-3 p-4 border border-indigo-200 bg-indigo-50 rounded-xl">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{escolhido.name}</p>
              <p className="text-xs text-gray-500 truncate">{escolhido.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {PAPEL[escolhido.role] || escolhido.role}
                {escolhido.city && ` · ${escolhido.city}${escolhido.state ? `/${escolhido.state}` : ''}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setEscolhido(null); setTermo('') }}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg"
            aria-label="Trocar de pessoa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div ref={caixa} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onFocus={() => resultados.length > 0 && setAberto(true)}
              placeholder="Buscar pelo nome ou e-mail da pessoa"
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {buscando && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>

          {aberto && resultados.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {resultados.map((conta) => (
                <li key={conta.id}>
                  <button
                    type="button"
                    onClick={() => { setEscolhido(conta); setAberto(false) }}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="block font-medium text-gray-900 text-sm">{conta.name}</span>
                    <span className="block text-xs text-gray-500">
                      {conta.email} · {PAPEL[conta.role] || conta.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {aberto && !buscando && termo.trim().length >= 2 && resultados.length === 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Ninguém encontrado. A conta precisa existir antes — crie em <strong>/admin/usuarios</strong>.
            </p>
          )}

          <p className="text-sm text-gray-500 mt-3">
            Deixe em branco para publicar em seu próprio nome ({meuNome}).
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Quem você escolher vira o dono do anúncio: é ele que recebe os contatos e é
        só ele que edita depois. Fica registrado que foi você quem cadastrou.
      </p>
    </div>
  )
}
