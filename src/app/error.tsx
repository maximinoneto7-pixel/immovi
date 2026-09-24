'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw } from 'lucide-react'

// Tela de erro do site. Além de não deixar a pessoa na mão, avisa a administração:
// antes disso, um erro de tela passava sem ninguém ficar sabendo.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/erros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onde: error.digest || 'página',
        mensagem: error.message,
        pilha: error.stack,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado nesta página</h1>
        <p className="text-sm text-gray-500 mb-6">
          Já avisamos a equipe. Você pode tentar de novo agora mesmo ou voltar para a busca.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Tentar de novo
          </button>
          <Link
            href="/imoveis"
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ver imóveis
          </Link>
        </div>
      </div>
    </div>
  )
}
