import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { isAsaasConfigured, ASAAS_PLANOS, ASAAS_FOGUETES } from '@/lib/asaas'
import {
  ArrowLeft, CheckCircle2, XCircle, ExternalLink,
  QrCode, FileText, CreditCard, Zap, Rocket,
} from 'lucide-react'

export default async function AdminAsaasPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const configured = isAsaasConfigured()
  const isSandbox = process.env.ASAAS_ENVIRONMENT !== 'production'

  const [totalRevenue, activeSubs] = await Promise.all([
    prisma.subscription.aggregate({ _sum: { amountPaid: true } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
  ])

  const revenue = totalRevenue._sum.amountPaid || 0

  const vars = [
    { key: 'ASAAS_API_KEY', label: 'Chave de API ($aact_...)', ok: !!process.env.ASAAS_API_KEY, required: true },
    { key: 'ASAAS_ENVIRONMENT', label: 'Ambiente (sandbox / production)', ok: !!process.env.ASAAS_ENVIRONMENT, required: true },
    { key: 'ASAAS_WEBHOOK_TOKEN', label: 'Token de autenticação do webhook', ok: !!process.env.ASAAS_WEBHOOK_TOKEN, required: false },
  ]

  return (
    <>
      <Header user={session.user as any} />
      <main className="flex-1 bg-gray-50 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🏦</span>
                Configuração do Asaas
              </h1>
              <p className="text-sm text-gray-500">PIX, Boleto e Cartão para o mercado brasileiro</p>
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 ${configured ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {configured
              ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
            <div>
              <div className={`font-semibold text-sm ${configured ? 'text-green-900' : 'text-red-900'}`}>
                {configured
                  ? `✅ Asaas configurado — modo ${isSandbox ? 'SANDBOX (teste)' : 'PRODUÇÃO'}`
                  : '❌ Asaas não configurado'}
              </div>
              <p className={`text-xs mt-0.5 ${configured ? 'text-green-700' : 'text-red-700'}`}>
                {configured
                  ? `Receita total: R$ ${revenue.toFixed(2)} • ${activeSubs} assinatura(s) ativa(s)`
                  : 'Configure a ASAAS_API_KEY no .env para ativar os pagamentos.'}
              </p>
            </div>
          </div>

          {/* Vantagens do Asaas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Por que usar o Asaas?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: QrCode, color: 'green', title: 'PIX', desc: 'Aprovação instantânea, 24h/7 dias. Sem taxas para receber.' },
                { icon: FileText, color: 'blue', title: 'Boleto', desc: 'Aceito por todos os bancos. Vence em 1-3 dias.' },
                { icon: CreditCard, color: 'violet', title: 'Cartão', desc: 'Crédito e débito. Parcelamento disponível.' },
              ].map((m) => (
                <div key={m.title} className={`p-4 rounded-xl ${m.color === 'green' ? 'bg-green-50' : m.color === 'blue' ? 'bg-indigo-50' : 'bg-violet-50'}`}>
                  <m.icon className={`w-6 h-6 mb-2 ${m.color === 'green' ? 'text-green-600' : m.color === 'blue' ? 'text-indigo-600' : 'text-violet-600'}`} />
                  <div className="font-bold text-gray-900 text-sm">{m.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status das variáveis */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Variáveis de ambiente</h2>
            <div className="space-y-2">
              {vars.map(({ key, label, ok, required }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <div>
                      <code className="text-xs font-mono text-gray-700">{key}</code>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {required && !ok && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">Obrigatório</span>}
                    <span className={`text-xs font-medium ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                      {ok ? 'Configurado' : 'Faltando'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guia passo a passo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-5">Guia de configuração</h2>
            <div className="space-y-6">

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Criar conta no Asaas</div>
                  <p className="text-sm text-gray-500 mb-2">Crie sua conta gratuitamente. Para testes, use o sandbox.</p>
                  <div className="flex gap-2 flex-wrap">
                    <a href="https://app.asaas.com/cadastre-se" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Criar conta (produção)
                    </a>
                    <a href="https://sandbox.asaas.com" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-amber-600 font-medium hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Sandbox (testes)
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Obter a chave de API</div>
                  <p className="text-sm text-gray-500 mb-2">No painel Asaas: <strong>Configurações → Integrações → Gerar nova chave</strong></p>
                  <div className="bg-gray-900 rounded-xl p-3 text-xs font-mono text-green-400 space-y-1">
                    <p><span className="text-gray-500"># .env</span></p>
                    <p>ASAAS_API_KEY="$aact_..."</p>
                    <p>ASAAS_ENVIRONMENT="sandbox"  <span className="text-gray-500"># ou "production"</span></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Configurar Webhook</div>
                  <p className="text-sm text-gray-500 mb-2">
                    No Asaas: <strong>Configurações → Integrações → Webhooks → Adicionar</strong>
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs break-all">
                      URL: https://www.immovi.com.br/api/asaas/webhook
                    </div>
                    <p className="text-xs text-gray-500">Eventos necessários:</p>
                    <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-gray-700 space-y-0.5">
                      <p>PAYMENT_RECEIVED</p>
                      <p>PAYMENT_CONFIRMED</p>
                      <p>PAYMENT_OVERDUE</p>
                      <p>SUBSCRIPTION_DELETED</p>
                    </div>
                    <p className="text-xs text-gray-500">Defina um token de autenticação (você escolhe) e adicione no .env:</p>
                    <div className="bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400">
                      ASAAS_WEBHOOK_TOKEN="meu_token_secreto_123"
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Reiniciar o servidor</div>
                  <div className="bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400">
                    npx next dev -p 3001
                  </div>
                  <p className="text-xs text-gray-400 mt-2">As variáveis do .env só são carregadas ao iniciar o servidor.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preços configurados */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Preços dos produtos</h2>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Planos (mensais)
              </div>
              {Object.entries(ASAAS_PLANOS).map(([id, p]) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{id}</div>
                    <div className="text-xs text-gray-400">{p.description}</div>
                  </div>
                  <div className="font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}/mês
                  </div>
                </div>
              ))}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" /> Foguetes (pagamento único)
              </div>
              {Object.entries(ASAAS_FOGUETES).map(([id, f]) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{id}</div>
                    <div className="text-xs text-gray-400">{f.description}</div>
                  </div>
                  <div className="font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.value)}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Para alterar os preços, edite <code className="bg-gray-100 px-1 rounded">src/lib/asaas.ts</code></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
