'use client'

import { useState, useMemo } from 'react'
import {
  Calculator, ChevronDown, ChevronUp, Info,
  TrendingUp, Home, FileText, DollarSign,
  CheckCircle2, AlertCircle, Printer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Alíquotas de ITBI por estado (média dos principais municípios) ────────────
const ITBI_POR_ESTADO: Record<string, number> = {
  SP: 3.0, RJ: 3.0, MG: 3.0, RS: 3.0, PR: 2.7, SC: 2.0,
  BA: 3.0, GO: 2.0, PE: 3.0, CE: 3.0, DF: 3.0, ES: 2.0,
  AM: 2.0, PA: 2.0, MT: 2.0, MS: 2.0, MA: 2.0, PB: 2.0,
  RN: 2.0, AL: 2.0, SE: 2.0, PI: 2.0, AC: 2.0, AP: 2.0,
  RO: 2.0, RR: 2.0, TO: 2.0,
}

// ─── Taxas de cartório estimadas (% sobre valor) ─────────────────────────────
// Fonte: tabelas estaduais (valores aproximados para cálculo)
const CARTORIO_PERCENTUAL = 0.9  // escritura + registro ≈ 0,9% (varia por faixa de valor)

const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtPct = (v: number) => `${v.toFixed(2).replace('.', ',')}%`

interface Custo {
  label: string
  valor: number
  percentual: number
  desc: string
  opcional?: boolean
  cor: string
}

export default function CustoCalculator() {
  // ─── Entradas ──────────────────────────────────────────────────────────────
  const [precoImovel, setPrecoImovel] = useState(500000)
  const [estado, setEstado] = useState('SP')
  const [itbiCustom, setItbiCustom] = useState<string>('')
  const [usaCorretor, setUsaCorretor] = useState(true)
  const [comissaoCorretor, setComissaoCorretor] = useState(6)
  const [usaFinanciamento, setUsaFinanciamento] = useState(false)
  const [valorEntrada, setValorEntrada] = useState(100000)
  const [prazoMeses, setPrazoMeses] = useState(360)
  const [taxaJuros, setTaxaJuros] = useState(10.5)
  const [fgts, setFgts] = useState(0)
  const [showDetalhes, setShowDetalhes] = useState(false)

  // ─── Cálculos ──────────────────────────────────────────────────────────────
  const custos = useMemo<Custo[]>(() => {
    const itbiRate = itbiCustom ? parseFloat(itbiCustom) : (ITBI_POR_ESTADO[estado] || 2)
    const itbi = precoImovel * (itbiRate / 100)

    // Escritura pública (tabela TABELIÃO — aprox. por faixa)
    let escritura = 0
    if (precoImovel <= 50000) escritura = 650
    else if (precoImovel <= 100000) escritura = 900
    else if (precoImovel <= 200000) escritura = 1400
    else if (precoImovel <= 500000) escritura = precoImovel * 0.0025
    else if (precoImovel <= 1000000) escritura = precoImovel * 0.002
    else escritura = precoImovel * 0.0015

    // Registro de imóveis (aprox. 50-70% da escritura)
    const registro = escritura * 0.6

    // Avaliação bancária (se financiamento)
    const avaliacaoBancaria = usaFinanciamento ? 1500 : 0

    // Comissão do corretor
    const comissao = usaCorretor ? precoImovel * (comissaoCorretor / 100) : 0

    const lista: Custo[] = [
      {
        label: 'ITBI',
        valor: itbi,
        percentual: itbiRate,
        desc: `Imposto de Transmissão de Bens Imóveis — alíquota ${fmtPct(itbiRate)} em ${estado}. Pago à Prefeitura antes da escritura.`,
        cor: 'red',
      },
      {
        label: 'Escritura pública',
        valor: escritura,
        percentual: (escritura / precoImovel) * 100,
        desc: 'Lavrada no Cartório de Notas. Obrigatória para imóveis acima de 30 salários mínimos.',
        cor: 'orange',
      },
      {
        label: 'Registro de imóveis',
        valor: registro,
        percentual: (registro / precoImovel) * 100,
        desc: 'Registro da escritura no Cartório de Registro de Imóveis. Só após o registro o comprador é o dono legal.',
        cor: 'amber',
      },
    ]

    if (usaFinanciamento) {
      lista.push({
        label: 'Avaliação bancária',
        valor: avaliacaoBancaria,
        percentual: (avaliacaoBancaria / precoImovel) * 100,
        desc: 'Laudo de avaliação exigido pelo banco financiador. Valor aproximado, varia por banco.',
        cor: 'blue',
        opcional: true,
      })
    }

    if (usaCorretor) {
      lista.push({
        label: `Comissão do corretor`,
        valor: comissao,
        percentual: comissaoCorretor,
        desc: `${fmtPct(comissaoCorretor)} do valor do imóvel. Normalmente paga pelo vendedor, mas pode ser negociado. Opcional se contratado diretamente.`,
        cor: 'violet',
        opcional: true,
      })
    }

    return lista
  }, [precoImovel, estado, itbiCustom, usaCorretor, comissaoCorretor, usaFinanciamento])

  const totalCustos = useMemo(() => custos.reduce((a, c) => a + c.valor, 0), [custos])
  const totalGasto = precoImovel + totalCustos

  // Simulação de financiamento
  const parcelaMensal = useMemo(() => {
    if (!usaFinanciamento) return 0
    const valorFinanciado = precoImovel - valorEntrada - fgts
    if (valorFinanciado <= 0) return 0
    const taxa = taxaJuros / 100 / 12
    if (taxa === 0) return valorFinanciado / prazoMeses
    return valorFinanciado * (taxa * Math.pow(1 + taxa, prazoMeses)) / (Math.pow(1 + taxa, prazoMeses) - 1)
  }, [precoImovel, valorEntrada, fgts, prazoMeses, taxaJuros, usaFinanciamento])

  const valorFinanciado = Math.max(0, precoImovel - valorEntrada - fgts)
  const totalPagoFinanciamento = parcelaMensal * prazoMeses

  const COR_MAP: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-indigo-100 text-indigo-700',
    violet: 'bg-violet-100 text-violet-700',
  }

  const inputMoeda = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    desc?: string
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {desc && <p className="text-xs text-gray-400 mb-1.5">{desc}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Painel de entradas ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Valor do imóvel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-500" /> Imóvel
            </h2>
            {inputMoeda('Valor do imóvel *', precoImovel, setPrecoImovel)}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {ESTADOS.map(s => (
                  <option key={s} value={s}>{s} — ITBI {fmtPct(ITBI_POR_ESTADO[s] || 2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                ITBI municipal (personalizado)
                <span className="text-xs text-gray-400 font-normal ml-1">— deixe em branco para usar o padrão do estado</span>
              </label>
              <div className="relative">
                <input type="number" step="0.1" min="0" max="5"
                  value={itbiCustom}
                  onChange={e => setItbiCustom(e.target.value)}
                  placeholder={String(ITBI_POR_ESTADO[estado] || 2)}
                  className="w-full pr-8 pl-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Corretor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" /> Corretor
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Incluir</span>
                <input type="checkbox" checked={usaCorretor} onChange={e => setUsaCorretor(e.target.checked)}
                  className="w-4 h-4 accent-violet-600" />
              </label>
            </div>
            {usaCorretor && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Comissão</label>
                <div className="relative">
                  <input type="number" step="0.5" min="0" max="10"
                    value={comissaoCorretor}
                    onChange={e => setComissaoCorretor(parseFloat(e.target.value) || 0)}
                    className="w-full pr-8 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">CRECI recomenda 6% para imóveis residenciais</p>
              </div>
            )}
          </div>

          {/* Financiamento */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" /> Financiamento
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Incluir</span>
                <input type="checkbox" checked={usaFinanciamento} onChange={e => setUsaFinanciamento(e.target.checked)}
                  className="w-4 h-4 accent-green-600" />
              </label>
            </div>

            {usaFinanciamento && (
              <div className="space-y-3">
                {inputMoeda('Valor de entrada', valorEntrada, setValorEntrada,
                  `${((valorEntrada / precoImovel) * 100).toFixed(0)}% do valor — mínimo 20%`)}
                {inputMoeda('FGTS a utilizar', fgts, setFgts, 'Opcional — saldo do FGTS')}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prazo</label>
                  <select value={prazoMeses} onChange={e => setPrazoMeses(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {[120, 180, 240, 300, 360, 420].map(m => (
                      <option key={m} value={m}>{m / 12} anos ({m} meses)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Taxa de juros ao ano</label>
                  <div className="relative">
                    <input type="number" step="0.1" min="1" max="30"
                      value={taxaJuros}
                      onChange={e => setTaxaJuros(parseFloat(e.target.value) || 0)}
                      className="w-full pr-8 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Média CEF 2024: 10,5% a.a. (TR + juros)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Painel de resultados ────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Custo total */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
            <p className="text-indigo-200 text-sm mb-1">Custo total de aquisição</p>
            <p className="text-4xl font-bold">{fmt(totalGasto)}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-indigo-100">
              <div>
                <span className="text-white font-semibold">{fmt(precoImovel)}</span>
                <span className="ml-1">imóvel</span>
              </div>
              <span>+</span>
              <div>
                <span className="text-amber-300 font-semibold">{fmt(totalCustos)}</span>
                <span className="ml-1">encargos ({fmtPct((totalCustos / precoImovel) * 100)})</span>
              </div>
            </div>
          </div>

          {/* Breakdown dos custos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Detalhamento dos encargos</h3>
            <div className="space-y-3">
              {custos.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0', COR_MAP[c.cor])}>
                      {fmtPct(c.percentual).replace(',00%', '%')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        {c.label}
                        {c.opcional && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-normal">opcional</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 text-sm flex-shrink-0">{fmt(c.valor)}</span>
                </div>
              ))}

              {/* Total encargos */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Total de encargos</span>
                <span className="font-bold text-red-600">{fmt(totalCustos)}</span>
              </div>
            </div>

            {/* Botão detalhar */}
            <button onClick={() => setShowDetalhes(!showDetalhes)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              {showDetalhes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showDetalhes ? 'Ocultar explicações' : 'Ver explicação de cada custo'}
            </button>

            {showDetalhes && (
              <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                {custos.map((c) => (
                  <div key={c.label} className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-gray-700">{c.label}: </span>
                      <span className="text-xs text-gray-500">{c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulação de financiamento */}
          {usaFinanciamento && parcelaMensal > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Simulação de Financiamento (Sistema Price)
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Valor financiado', value: fmt(valorFinanciado), color: 'blue' },
                  { label: 'Parcela inicial', value: fmt(parcelaMensal), color: 'green', sub: '/mês' },
                  { label: 'Total a pagar', value: fmt(totalPagoFinanciamento), color: 'red' },
                  { label: 'Juros totais', value: fmt(Math.max(0, totalPagoFinanciamento - valorFinanciado)), color: 'orange' },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className={cn(
                    'p-3 rounded-xl',
                    color === 'blue' ? 'bg-indigo-50' :
                    color === 'green' ? 'bg-green-50' :
                    color === 'red' ? 'bg-red-50' : 'bg-orange-50'
                  )}>
                    <div className={cn(
                      'text-xs font-medium mb-0.5',
                      color === 'blue' ? 'text-indigo-600' :
                      color === 'green' ? 'text-green-600' :
                      color === 'red' ? 'text-red-600' : 'text-orange-600'
                    )}>{label}</div>
                    <div className={cn(
                      'text-base font-bold',
                      color === 'blue' ? 'text-indigo-800' :
                      color === 'green' ? 'text-green-800' :
                      color === 'red' ? 'text-red-800' : 'text-orange-800'
                    )}>{value}{sub && <span className="text-xs font-normal">{sub}</span>}</div>
                  </div>
                ))}
              </div>

              {valorEntrada / precoImovel < 0.2 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  A maioria dos bancos exige entrada mínima de 20% ({fmt(precoImovel * 0.2)}).
                </div>
              )}

              <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                <p className="text-xs text-indigo-700">
                  💡 Compare com o <strong>simulador de financiamento</strong> completo na página de Serviços para ver as condições reais de cada banco.
                </p>
              </div>
            </div>
          )}

          {/* Resumo final */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Resumo geral</h3>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Valor do imóvel', valor: precoImovel, destaque: false },
                ...(usaFinanciamento ? [
                  { label: 'Entrada (à vista)', valor: valorEntrada + fgts, destaque: false },
                  { label: 'Valor financiado', valor: valorFinanciado, destaque: false },
                ] : []),
                { label: 'Encargos de compra (ITBI + cartório + outros)', valor: totalCustos, destaque: true, color: 'text-red-600' },
              ].map(({ label, valor, destaque, color }) => (
                <div key={label} className={cn('flex items-center justify-between', destaque && 'font-semibold')}>
                  <span className={cn('text-gray-600', destaque && 'text-gray-800')}>{label}</span>
                  <span className={cn('font-bold', color || 'text-gray-900')}>{fmt(valor)}</span>
                </div>
              ))}

              <div className="border-t-2 border-gray-200 pt-2.5 flex items-center justify-between font-bold">
                <span className="text-gray-900 text-base">Total necessário à vista</span>
                <span className="text-indigo-700 text-xl">{fmt(usaFinanciamento ? valorEntrada + fgts + totalCustos : totalGasto)}</span>
              </div>

              {usaFinanciamento && parcelaMensal > 0 && (
                <div className="flex items-center justify-between text-green-700 font-semibold bg-green-50 p-2.5 rounded-xl">
                  <span>+ Parcela mensal (1ª)</span>
                  <span>{fmt(parcelaMensal)}/mês por {prazoMeses / 12} anos</span>
                </div>
              )}
            </div>
          </div>

          {/* Imprimir */}
          <button onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors print:hidden">
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  )
}
