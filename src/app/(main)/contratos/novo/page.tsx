'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import {
  FileText, Loader2, Eye, Save, AlertCircle,
  Plus, Trash2, User, Home, DollarSign, Users, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Parte {
  nome: string; cpf: string; rg: string; endereco: string
  nacionalidade: string; estadoCivil: string; naturalidade: string; profissao: string
}

const PARTE_VAZIA: Parte = {
  nome: '', cpf: '', rg: '', endereco: '',
  nacionalidade: 'brasileiro(a)', estadoCivil: '', naturalidade: '', profissao: '',
}

const ESTADOS_CIVIS = [
  { value: '', label: 'Selecione' },
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a) Judicialmente' },
]

const FORMAS_PAGAMENTO = [
  { value: '', label: 'Selecione a forma' },
  { value: 'PIX', label: 'PIX' },
  { value: 'TED', label: 'TED / Transferência bancária' },
  { value: 'DOC', label: 'DOC' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'espécie', label: 'Espécie (dinheiro)' },
  { value: 'financiamento bancário', label: 'Financiamento bancário (FGTS/CEF/etc.)' },
  { value: 'permuta', label: 'Permuta (troca de bens)' },
  { value: 'parcelado', label: 'Parcelado diretamente com o vendedor' },
  { value: 'boleto', label: 'Boleto bancário' },
  { value: 'cartão de crédito', label: 'Cartão de crédito' },
]

const CONTRACT_TYPES: Record<string, { label: string; partyA: string; partyB: string; desc: string }> = {
  PROMESSA_COMPRA_VENDA: {
    label: 'Promessa de Compra e Venda',
    partyA: 'Vendedor(es)',
    partyB: 'Comprador(es)',
    desc: 'Para venda com sinal e prazo para escritura',
  },
  LOCACAO: {
    label: 'Contrato de Locação',
    partyA: 'Locador(es) / Proprietário(s)',
    partyB: 'Locatário(s) / Inquilino(s)',
    desc: 'Locação residencial ou comercial — Lei 8.245/91',
  },
  PERMUTA: {
    label: 'Contrato de Permuta',
    partyA: 'Permutante(s) A',
    partyB: 'Permutante(s) B',
    desc: 'Troca de imóveis entre partes',
  },
  CESSAO: {
    label: 'Cessão de Direitos',
    partyA: 'Cedente(s)',
    partyB: 'Cessionário(s)',
    desc: 'Cessão de direitos sobre imóvel',
  },
}

// ─── Componente de Parte ─────────────────────────────────────────────────────

function ParteForm({
  parte, index, titulo, onChange, onRemove, canRemove,
}: {
  parte: Parte; index: number; titulo: string
  onChange: (idx: number, field: keyof Parte, value: string) => void
  onRemove: (idx: number) => void; canRemove: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const inp = (label: string, field: keyof Parte, placeholder?: string, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={parte[field]} onChange={(e) => onChange(index, field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-sm text-gray-800">
            {titulo} {index + 1}: {parte.nome || <span className="text-gray-400 font-normal">não preenchido</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(index) }}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Dados principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inp('Nome completo *', 'nome', 'João da Silva')}
            {inp('CPF *', 'cpf', '000.000.000-00')}
            {inp('RG', 'rg', '00.000.000-0')}
            {inp('Profissão', 'profissao', 'Engenheiro')}
          </div>

          {/* Qualificação completa */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Qualificação</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidade</label>
                <input type="text" value={parte.nacionalidade}
                  onChange={(e) => onChange(index, 'nacionalidade', e.target.value)}
                  placeholder="brasileiro(a)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado civil</label>
                <select value={parte.estadoCivil} onChange={(e) => onChange(index, 'estadoCivil', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {ESTADOS_CIVIS.map(ec => <option key={ec.value} value={ec.value}>{ec.label}</option>)}
                </select>
              </div>
              {inp('Naturalidade', 'naturalidade', 'São Paulo/SP')}
            </div>
            {inp('Endereço completo', 'endereco', 'Rua X, nº 123, Bairro, Cidade/UF')}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Formulário principal ────────────────────────────────────────────────────

function NovoContratoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [error, setError] = useState('')

  const defaultType = searchParams.get('type') || 'PROMESSA_COMPRA_VENDA'

  const [contractType, setContractType] = useState(defaultType)
  const [title, setTitle] = useState('')

  // Partes (arrays)
  const [parteA, setParteA] = useState<Parte[]>([{ ...PARTE_VAZIA }])
  const [parteB, setParteB] = useState<Parte[]>([{ ...PARTE_VAZIA }])

  // Dados do imóvel
  const [property, setProperty] = useState({
    propertyAddress: '', propertyCity: '', propertyState: '',
    propertyDescription: '', propertyRegistration: '',
  })

  // Valores por tipo
  const [values, setValues] = useState({
    // Compra e venda
    totalPrice: '', signalAmount: '', remainingAmount: '',
    paymentConditions: '', completionDate: '',
    paymentMethod: '',          // forma de pagamento do sinal
    remainingPaymentMethod: '', // forma de pagamento do saldo
    // Locação
    rentValue: '', rentDuration: '', rentGuarantee: '',
    rentStartDate: '', condoFee: '', condoFeeBy: 'LOCATARIO',
    iptu: '', iptuBy: 'LOCATARIO',
    rentPaymentMethod: '',      // forma de pagamento do aluguel
    // Permuta
    propertyADescription: '', propertyBDescription: '', complementaryValue: '',
    complementaryPaymentMethod: '', // forma de pagamento da torna
    // Cessão
    cessaoObject: '',
    cessaoPaymentMethod: '',    // forma de pagamento da cessão
  })

  // Testemunhas e local
  const [witnesses, setWitnesses] = useState({
    witnessName1: '', witnessCpf1: '', witnessName2: '', witnessCpf2: '', city: '',
  })

  const typeInfo = CONTRACT_TYPES[contractType] || CONTRACT_TYPES.PROMESSA_COMPRA_VENDA

  const handleTypeChange = (t: string) => {
    setContractType(t)
    setTitle('')
    setPreview(false)
  }

  const updateParteA = (i: number, field: keyof Parte, v: string) =>
    setParteA(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: v } : p))
  const updateParteB = (i: number, field: keyof Parte, v: string) =>
    setParteB(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: v } : p))

  const buildPayload = () => ({
    type: contractType, title,
    parteA, parteB,
    ...property, ...values, ...witnesses,
  })

  const handlePreview = async () => {
    setError('')
    const res = await fetch('/api/contratos/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    })
    const data = await res.json()
    if (data.html) { setPreviewHtml(data.html); setPreview(true) }
    else setError(data.error || 'Erro ao gerar visualização.')
  }

  const handleSave = async () => {
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (data.id) router.push(`/contratos/${data.id}`)
      else setError(data.error || 'Erro ao salvar contrato.')
    })
  }

  const setP = (k: string, v: string) => setProperty(p => ({ ...p, [k]: v }))
  const setV = (k: string, v: string) => setValues(p => ({ ...p, [k]: v }))
  const setW = (k: string, v: string) => setWitnesses(p => ({ ...p, [k]: v }))

  const inp = (label: string, val: string, onChange: (v: string) => void, placeholder?: string, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  )

  const sel = (label: string, val: string, onChange: (v: string) => void, opts: {value:string;label:string}[]) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={val} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const ta = (label: string, val: string, onChange: (v: string) => void, placeholder?: string, rows = 3) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
    </div>
  )

  if (preview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              ← Editar
            </button>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar</>}
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">
                Imprimir / PDF
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    )
  }

  return (
    <>
      <Header user={null} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <FileText className="w-6 h-6 text-indigo-600" />
            Novo Contrato
          </h1>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-5">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-5">
            {/* ─── TIPO ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">Tipo de Contrato</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(CONTRACT_TYPES).map(([k, info]) => (
                  <button key={k} type="button" onClick={() => handleTypeChange(k)}
                    className={cn('text-left p-3 rounded-xl border-2 transition-all',
                      contractType === k ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200')}>
                    <div className={`font-semibold text-sm ${contractType === k ? 'text-indigo-700' : 'text-gray-800'}`}>{info.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{info.desc}</div>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título do contrato</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={`Ex: ${typeInfo.label} — Rua das Flores, 123`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            {/* ─── PARTE A ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm">{typeInfo.partyA}</h2>
                <button type="button" onClick={() => setParteA(ps => [...ps, { ...PARTE_VAZIA }])}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700">
                  <Plus className="w-3.5 h-3.5" /> Adicionar {typeInfo.partyA.replace('(es)', '').replace('(s)', '')}
                </button>
              </div>
              {parteA.map((p, i) => (
                <ParteForm key={i} parte={p} index={i} titulo={typeInfo.partyA.replace('(es)', '').replace('(s)', '')}
                  onChange={updateParteA} onRemove={idx => setParteA(ps => ps.filter((_, j) => j !== idx))}
                  canRemove={parteA.length > 1} />
              ))}
            </div>

            {/* ─── PARTE B ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm">{typeInfo.partyB}</h2>
                <button type="button" onClick={() => setParteB(ps => [...ps, { ...PARTE_VAZIA }])}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700">
                  <Plus className="w-3.5 h-3.5" /> Adicionar {typeInfo.partyB.replace('(es)', '').replace('(s)', '')}
                </button>
              </div>
              {parteB.map((p, i) => (
                <ParteForm key={i} parte={p} index={i} titulo={typeInfo.partyB.replace('(es)', '').replace('(s)', '')}
                  onChange={updateParteB} onRemove={idx => setParteB(ps => ps.filter((_, j) => j !== idx))}
                  canRemove={parteB.length > 1} />
              ))}
            </div>

            {/* ─── IMÓVEL ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-indigo-500" /> Dados do Imóvel
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inp('Endereço *', property.propertyAddress, v => setP('propertyAddress', v), 'Rua das Flores, 123')}
                {inp('Cidade *', property.propertyCity, v => setP('propertyCity', v), 'São Paulo')}
                {inp('Estado *', property.propertyState, v => setP('propertyState', v), 'SP')}
                {inp('Matrícula (nº cartório)', property.propertyRegistration, v => setP('propertyRegistration', v), '12.345')}
              </div>
              {ta('Descrição completa do imóvel', property.propertyDescription, v => setP('propertyDescription', v),
                'Casa com 3 quartos, 2 banheiros, 150m², área de 300m²...')}
            </div>

            {/* ─── COMPRA E VENDA ─── */}
            {contractType === 'PROMESSA_COMPRA_VENDA' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" /> Valores e Pagamento
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {inp('Valor total (R$) *', values.totalPrice, v => setV('totalPrice', v), '450.000,00')}
                  {inp('Sinal / Arras (R$)', values.signalAmount, v => setV('signalAmount', v), '45.000,00')}
                  {inp('Saldo restante (R$)', values.remainingAmount, v => setV('remainingAmount', v), '405.000,00')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sel('Forma de pagamento do sinal', values.paymentMethod, v => setV('paymentMethod', v), FORMAS_PAGAMENTO)}
                  {sel('Forma de pagamento do saldo', values.remainingPaymentMethod, v => setV('remainingPaymentMethod', v), FORMAS_PAGAMENTO)}
                </div>
                {ta('Condições adicionais de pagamento', values.paymentConditions, v => setV('paymentConditions', v),
                  'O saldo será pago em parcela única após aprovação do financiamento...')}
                {inp('Data para escritura definitiva', values.completionDate, v => setV('completionDate', v), '01/12/2025')}
              </div>
            )}

            {/* ─── LOCAÇÃO ─── */}
            {contractType === 'LOCACAO' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" /> Condições da Locação
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp('Valor do aluguel (R$/mês) *', values.rentValue, v => setV('rentValue', v), '2.500,00')}
                  {sel('Forma de pagamento do aluguel', values.rentPaymentMethod, v => setV('rentPaymentMethod', v), FORMAS_PAGAMENTO)}
                  {inp('Duração do contrato', values.rentDuration, v => setV('rentDuration', v), '30 meses')}
                  {inp('Data de início', values.rentStartDate, v => setV('rentStartDate', v), '01/01/2025')}
                  {sel('Garantia locatícia', values.rentGuarantee, v => setV('rentGuarantee', v), [
                    { value: '', label: 'Selecione' },
                    { value: 'caução', label: 'Caução (3 meses)' },
                    { value: 'fiador', label: 'Fiador' },
                    { value: 'seguro fiança', label: 'Seguro fiança' },
                    { value: 'título de capitalização', label: 'Título de capitalização' },
                    { value: 'sem garantia', label: 'Sem garantia' },
                  ])}
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Encargos mensais</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {inp('Condomínio (R$)', values.condoFee, v => setV('condoFee', v), '350,00')}
                    {sel('Pago por', values.condoFeeBy, v => setV('condoFeeBy', v), [
                      { value: 'LOCATARIO', label: 'Locatário' },
                      { value: 'LOCADOR', label: 'Locador' },
                      { value: 'INCLUSO', label: 'Incluso' },
                    ])}
                    {inp('IPTU (R$/mês)', values.iptu, v => setV('iptu', v), '120,00')}
                    {sel('Pago por', values.iptuBy, v => setV('iptuBy', v), [
                      { value: 'LOCATARIO', label: 'Locatário' },
                      { value: 'LOCADOR', label: 'Locador' },
                      { value: 'INCLUSO', label: 'Incluso' },
                    ])}
                  </div>
                </div>
                {ta('Condições especiais', values.paymentConditions, v => setV('paymentConditions', v),
                  'Reajuste anual pelo IGP-M. Vedada sublocação...')}
              </div>
            )}

            {/* ─── PERMUTA ─── */}
            {contractType === 'PERMUTA' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" /> Bens Permutados
                </h2>
                {ta('Imóvel do(s) Permutante(s) A', values.propertyADescription, v => setV('propertyADescription', v),
                  'Casa com 3 quartos em São Paulo/SP, avaliada em R$ 500.000,00...')}
                {ta('Imóvel do(s) Permutante(s) B', values.propertyBDescription, v => setV('propertyBDescription', v),
                  'Apartamento com 2 quartos no Rio de Janeiro/RJ, avaliado em R$ 450.000,00...')}
                {inp('Valor complementar — torna (se houver)', values.complementaryValue, v => setV('complementaryValue', v), 'R$ 50.000,00')}
                {sel('Forma de pagamento da torna', values.complementaryPaymentMethod, v => setV('complementaryPaymentMethod', v), FORMAS_PAGAMENTO)}
                {ta('Condições', values.paymentConditions, v => setV('paymentConditions', v), 'O valor complementar será pago em...')}
              </div>
            )}

            {/* ─── CESSÃO ─── */}
            {contractType === 'CESSAO' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" /> Objeto da Cessão
                </h2>
                {ta('O que está sendo cedido', values.cessaoObject, v => setV('cessaoObject', v),
                  'Todos os direitos sobre o contrato de compra e venda nº..., referentes ao imóvel...', 4)}
                {inp('Valor da cessão (R$)', values.totalPrice, v => setV('totalPrice', v), '50.000,00')}
                {sel('Forma de pagamento', values.cessaoPaymentMethod, v => setV('cessaoPaymentMethod', v), FORMAS_PAGAMENTO)}
                {ta('Condições de pagamento', values.paymentConditions, v => setV('paymentConditions', v), 'O valor será pago em...')}
              </div>
            )}

            {/* ─── TESTEMUNHAS E LOCAL ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" /> Testemunhas e Local
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inp('Nome da 1ª testemunha', witnesses.witnessName1, v => setW('witnessName1', v))}
                {inp('CPF da 1ª testemunha', witnesses.witnessCpf1, v => setW('witnessCpf1', v))}
                {inp('Nome da 2ª testemunha', witnesses.witnessName2, v => setW('witnessName2', v))}
                {inp('CPF da 2ª testemunha', witnesses.witnessCpf2, v => setW('witnessCpf2', v))}
              </div>
              {inp('Cidade de assinatura *', witnesses.city, v => setW('city', v), 'São Paulo')}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button type="button" onClick={handlePreview}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
                <Eye className="w-5 h-5" /> Visualizar contrato
              </button>
              <button type="button" onClick={handleSave} disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {isPending ? <><Loader2 className="w-5 h-5 animate-spin" />Salvando...</> : <><Save className="w-5 h-5" />Salvar contrato</>}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function NovoContratoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <NovoContratoContent />
    </Suspense>
  )
}
