'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  QrCode, FileText, CreditCard, Loader2, CheckCircle2,
  Copy, ExternalLink, X, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'
type CheckoutType = 'plan' | 'boost'

interface AsaasCheckoutProps {
  type: CheckoutType
  planId?: string
  boostType?: string
  propertyId?: string
  price: number
  description: string
  initialBillingType?: BillingType
  onClose?: () => void
}

const BILLING_OPTIONS: { id: BillingType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'PIX', label: 'PIX', icon: QrCode, desc: 'Aprovação instantânea' },
  { id: 'BOLETO', label: 'Boleto', icon: FileText, desc: 'Vence em 1 dia útil' },
  { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard, desc: 'Débito ou crédito' },
]

export default function AsaasCheckout({
  type, planId, boostType, propertyId, price, description, initialBillingType, onClose,
}: AsaasCheckoutProps) {
  const router = useRouter()
  const [billingType, setBillingType] = useState<BillingType>(initialBillingType || 'PIX')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, planId, boostType, propertyId, billingType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar pagamento.')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyPix = () => {
    if (result?.payload) {
      navigator.clipboard.writeText(result.payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(price)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{description}</h3>
            <div className="text-2xl font-bold text-indigo-600 mt-0.5">{formattedPrice}
              {type === 'plan' && <span className="text-sm font-normal text-gray-400">/mês</span>}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5">
          {!result ? (
            <>
              {/* Seleção do método */}
              <p className="text-sm font-semibold text-gray-700 mb-3">Como prefere pagar?</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {BILLING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setBillingType(opt.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                      billingType === opt.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <opt.icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-xs text-gray-400 leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Gerando pagamento...</>
                ) : (
                  <><Zap className="w-5 h-5" /> Pagar com {billingType === 'PIX' ? 'PIX' : billingType === 'BOLETO' ? 'Boleto' : 'Cartão'}</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                🔒 Pagamento seguro via Asaas • PIX, Boleto ou Cartão
              </p>
            </>
          ) : (
            /* Resultado do pagamento */
            <div className="space-y-4">
              {/* PIX */}
              {billingType === 'PIX' && result.encodedImage && (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                    <QrCode className="w-5 h-5" />
                    QR Code PIX gerado
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-3 inline-block">
                    <img
                      src={`data:image/png;base64,${result.encodedImage}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Escaneie com o app do seu banco</p>

                  {result.payload && (
                    <button
                      onClick={copyPix}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-indigo-200 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-sm"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar código PIX'}
                    </button>
                  )}

                  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-2">
                    ⏳ Após o pagamento, o plano é ativado automaticamente em até 1 minuto.
                  </p>
                </div>
              )}

              {/* Boleto */}
              {billingType === 'BOLETO' && (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-indigo-700 font-semibold">
                    <FileText className="w-5 h-5" />
                    Boleto gerado
                  </div>
                  <p className="text-sm text-gray-500">
                    O boleto vence em 1 dia útil. Após o pagamento, a ativação ocorre em até 2 dias úteis.
                  </p>
                  {result.invoiceUrl && (
                    <a
                      href={result.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir boleto para imprimir
                    </a>
                  )}
                </div>
              )}

              {/* Cartão — redireciona para página do Asaas */}
              {billingType === 'CREDIT_CARD' && (
                <div className="text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <div className="font-semibold text-gray-900">Redirecionando para pagamento...</div>
                  {result.invoiceUrl && (
                    <a href={result.invoiceUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
                      <CreditCard className="w-4 h-4" />
                      Pagar com cartão
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => { onClose?.(); router.push('/pagamentos') }}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Ver meus pagamentos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
