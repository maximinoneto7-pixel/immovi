'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react'

interface CreciVerifierProps {
  userId: string
  isVerified: boolean
  crecrNumber: string
  creciState: string
}

export default function CreciVerifier({ userId, isVerified, crecrNumber, creciState }: CreciVerifierProps) {
  const [verified, setVerified] = useState(isVerified)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/verificar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !verified }),
      })
      if (res.ok) setVerified(!verified)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {crecrNumber && (
        <a
          href={`https://www.cofeci.gov.br/portal/publico/busca-corretor?creci=${crecrNumber}&uf=${creciState}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Consultar no COFECI"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
          verified
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : verified ? (
          <><XCircle className="w-3.5 h-3.5" /> Revogar</>
        ) : (
          <><CheckCircle2 className="w-3.5 h-3.5" /> Verificar</>
        )}
      </button>
    </div>
  )
}
