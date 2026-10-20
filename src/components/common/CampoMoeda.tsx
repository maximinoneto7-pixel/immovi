'use client'

import { useState } from 'react'

/**
 * Campo de dinheiro em reais.
 *
 * Antes era <input type="number"> cru: quem digitava 2100000 não via se tinha
 * acertado a quantidade de zeros, e nada indicava os centavos. Aqui a pessoa só
 * digita números e eles entram pela direita — 210000000 vira R$ 2.100.000,00 —
 * enquanto o formulário continua recebendo o valor em reais, com ponto decimal.
 */
export default function CampoMoeda({
  name,
  defaultValue,
  required,
  placeholder = '0,00',
}: {
  name: string
  defaultValue?: number | null
  required?: boolean
  placeholder?: string
}) {
  // Trabalhamos em centavos para não esbarrar no arredondamento de ponto flutuante
  const [centavos, setCentavos] = useState<number>(
    defaultValue != null ? Math.round(defaultValue * 100) : 0
  )

  const formatado = (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const digitar = (texto: string) => {
    const somenteDigitos = texto.replace(/\D/g, '').slice(0, 13)
    setCentavos(somenteDigitos ? parseInt(somenteDigitos, 10) : 0)
  }

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={centavos === 0 ? '' : formatado}
        onChange={(e) => digitar(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-label="Valor em reais"
        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {/* O que o formulário envia: reais com ponto decimal, como o servidor espera */}
      <input type="hidden" name={name} value={centavos === 0 ? '' : (centavos / 100).toFixed(2)} />
    </div>
  )
}
