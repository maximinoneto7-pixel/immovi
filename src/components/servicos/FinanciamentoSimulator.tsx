'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Calculator, TrendingDown, Info } from 'lucide-react'

interface SimulationResult {
  bank: string
  rate: number
  monthlyPayment: number
  totalAmount: number
  totalInterest: number
}

export default function FinanciamentoSimulator() {
  const [propertyValue, setPropertyValue] = useState(500000)
  const [downPayment, setDownPayment] = useState(100000)
  const [months, setMonths] = useState(360)
  const [results, setResults] = useState<SimulationResult[] | null>(null)

  const banks = [
    { name: 'Caixa Econômica', rate: 10.99 },
    { name: 'Banco do Brasil', rate: 11.49 },
    { name: 'Itaú', rate: 11.99 },
    { name: 'Bradesco', rate: 12.49 },
    { name: 'Santander', rate: 12.99 },
  ]

  const simulate = () => {
    const loanAmount = propertyValue - downPayment
    if (loanAmount <= 0) return

    const simResults = banks.map((bank) => {
      const monthlyRate = bank.rate / 100 / 12
      const monthlyPayment =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      const totalAmount = monthlyPayment * months
      const totalInterest = totalAmount - loanAmount

      return {
        bank: bank.name,
        rate: bank.rate,
        monthlyPayment,
        totalAmount,
        totalInterest,
      }
    })

    setResults(simResults)
  }

  const downPaymentPercent = Math.round((downPayment / propertyValue) * 100)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Valor do imóvel
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value))}
                min={50000}
                step={10000}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Entrada ({downPaymentPercent}% — mín. 20%)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                min={propertyValue * 0.2}
                step={5000}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prazo</label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={120}>10 anos (120 meses)</option>
              <option value={180}>15 anos (180 meses)</option>
              <option value={240}>20 anos (240 meses)</option>
              <option value={300}>25 anos (300 meses)</option>
              <option value={360}>30 anos (360 meses)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 p-3 bg-indigo-50 rounded-xl flex items-center gap-2 text-sm text-indigo-700">
          <Info className="w-4 h-4 flex-shrink-0" />
          Valor financiado: <strong>{formatCurrency(Math.max(0, propertyValue - downPayment))}</strong>
        </div>

        <button
          onClick={simulate}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Calculator className="w-5 h-5" />
          Simular financiamento
        </button>
      </div>

      {results && (
        <div className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-500" />
            Resultado da simulação — melhor primeiro
          </h3>
          <div className="space-y-3">
            {results.sort((a, b) => a.monthlyPayment - b.monthlyPayment).map((r, i) => (
              <div
                key={r.bank}
                className={`p-4 rounded-xl border transition-colors ${
                  i === 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{r.bank}</div>
                      <div className="text-xs text-gray-500">Taxa: {r.rate}% a.a.</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${i === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                      {formatCurrency(r.monthlyPayment)}/mês
                    </div>
                    <div className="text-xs text-gray-500">
                      Total: {formatCurrency(r.totalAmount)}
                    </div>
                  </div>
                </div>
                {i === 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200 text-xs text-green-700 font-medium">
                    ✓ Melhor opção — Juros totais: {formatCurrency(r.totalInterest)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            * Simulação com sistema Price (parcelas fixas). Taxas podem variar. Consulte seu banco para proposta definitiva.
          </p>
        </div>
      )}
    </div>
  )
}
