import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { PLANOS, formatPrice } from '@/lib/stripe'
import {
  CreditCard, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  ExternalLink, Copy, Terminal, Crown, Rocket, Zap,
} from 'lucide-react'

function envStatus(key: string) {
  return !!process.env[key]
}

export default async function AdminStripePage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/')

  const [totalRevenue, activeSubscriptions, recentSubs] = await Promise.all([
    prisma.subscription.aggregate({ _sum: { amountPaid: true } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const stripeKeys = {
    secret: envStatus('STRIPE_SECRET_KEY'),
    publishable: envStatus('STRIPE_PUBLISHABLE_KEY'),
    webhook: envStatus('STRIPE_WEBHOOK_SECRET'),
    destaque: envStatus('STRIPE_PRICE_DESTAQUE'),
    profissional: envStatus('STRIPE_PRICE_PROFISSIONAL'),
    imobiliaria: envStatus('STRIPE_PRICE_IMOBILIARIA'),
    foguete7: envStatus('STRIPE_PRICE_FOGUETE_7'),
    foguete15: envStatus('STRIPE_PRICE_FOGUETE_15'),
    foguete30: envStatus('STRIPE_PRICE_FOGUETE_30'),
  }

  const allConfigured = Object.values(stripeKeys).every(Boolean)
  const coreConfigured = stripeKeys.secret && stripeKeys.webhook

  const revenue = totalRevenue._sum.amountPaid || 0

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
                <CreditCard className="w-5 h-5 text-indigo-500" />
                Configuração do Stripe
              </h1>
              <p className="text-sm text-gray-500">Pagamentos, assinaturas e produtos</p>
            </div>
          </div>

          {/* Status geral */}
          <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 ${
            allConfigured ? 'bg-green-50 border-green-200' :
            coreConfigured ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            {allConfigured ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> :
             coreConfigured ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" /> :
             <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
            <div>
              <div className={`font-semibold text-sm ${allConfigured ? 'text-green-900' : coreConfigured ? 'text-amber-900' : 'text-red-900'}`}>
                {allConfigured ? '✅ Stripe totalmente configurado' :
                 coreConfigured ? '⚠️ Configuração parcial — price IDs faltando' :
                 '❌ Stripe não configurado'}
              </div>
              <p className={`text-xs mt-0.5 ${allConfigured ? 'text-green-700' : coreConfigured ? 'text-amber-700' : 'text-red-700'}`}>
                {allConfigured ? `Pagamentos ativos. Receita total: ${formatPrice(revenue * 100)}` :
                 coreConfigured ? 'Chaves principais OK. Adicione os price IDs dos produtos.' :
                 'Siga o guia abaixo para configurar.'}
              </p>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Receita total', value: formatPrice(revenue * 100), icon: CreditCard, color: 'green' },
              { label: 'Assinaturas ativas', value: activeSubscriptions, icon: Crown, color: 'blue' },
              { label: 'Modo', value: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TESTE' : process.env.STRIPE_SECRET_KEY ? 'PRODUÇÃO' : 'Inativo', icon: Zap, color: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'amber' : 'green' },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center ${m.color === 'green' ? 'bg-green-100 text-green-600' : m.color === 'blue' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-gray-900">{m.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Status das chaves */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Status das variáveis de ambiente</h2>
            <div className="space-y-2">
              {[
                { key: 'STRIPE_SECRET_KEY', label: 'Chave secreta', status: stripeKeys.secret, required: true },
                { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Chave pública', status: stripeKeys.publishable, required: true },
                { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook secret (whsec_...)', status: stripeKeys.webhook, required: true },
                { key: 'STRIPE_PRICE_DESTAQUE', label: 'Price ID — Plano Destaque', status: stripeKeys.destaque, required: false },
                { key: 'STRIPE_PRICE_PROFISSIONAL', label: 'Price ID — Plano Profissional', status: stripeKeys.profissional, required: false },
                { key: 'STRIPE_PRICE_IMOBILIARIA', label: 'Price ID — Plano Imobiliária', status: stripeKeys.imobiliaria, required: false },
                { key: 'STRIPE_PRICE_FOGUETE_7', label: 'Price ID — Foguete 7 dias', status: stripeKeys.foguete7, required: false },
                { key: 'STRIPE_PRICE_FOGUETE_15', label: 'Price ID — Foguete 15 dias', status: stripeKeys.foguete15, required: false },
                { key: 'STRIPE_PRICE_FOGUETE_30', label: 'Price ID — Foguete 30 dias', status: stripeKeys.foguete30, required: false },
              ].map(({ key, label, status, required }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    {status
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                    <div>
                      <code className="text-xs text-gray-700 font-mono">{key}</code>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {required && !status && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">Obrigatório</span>
                    )}
                    <span className={`text-xs font-medium ${status ? 'text-green-600' : 'text-gray-400'}`}>
                      {status ? 'Configurado' : 'Faltando'}
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
              {/* Passo 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Criar conta no Stripe</div>
                  <p className="text-sm text-gray-500 mb-2">Acesse dashboard.stripe.com, crie sua conta e ative seu negócio.</p>
                  <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> dashboard.stripe.com/register
                  </a>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Copiar as chaves de API</div>
                  <p className="text-sm text-gray-500 mb-2">No Stripe: Developers → API Keys. Copie a chave secreta e a pública.</p>
                  <div className="bg-gray-900 rounded-xl p-3 text-xs font-mono text-green-400 space-y-1">
                    <p><span className="text-gray-500"># .env — Modo teste (começa com sk_test_)</span></p>
                    <p>STRIPE_SECRET_KEY="sk_test_..."</p>
                    <p>STRIPE_PUBLISHABLE_KEY="pk_test_..."</p>
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Criar produtos automaticamente</div>
                  <p className="text-sm text-gray-500 mb-2">Rode o script abaixo — ele cria todos os planos e foguetes no Stripe.</p>
                  <div className="bg-gray-900 rounded-xl p-3 text-xs font-mono text-green-400">
                    <span className="text-gray-500"># No terminal do projeto:</span><br/>
                    node scripts/setup-stripe.mjs
                  </div>
                  <p className="text-xs text-gray-400 mt-2">O script vai imprimir os price IDs para você copiar no .env</p>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Configurar o Webhook</div>
                  <p className="text-sm text-gray-500 mb-2">O webhook avisa o sistema quando alguém paga. Sem ele, os planos não ativam.</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">No Stripe: <strong>Developers → Webhooks → Add endpoint</strong></p>
                    <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs">
                      URL: https://SEU_DOMINIO/api/stripe/webhook
                    </div>
                    <p className="text-gray-600 text-xs">Eventos necessários:</p>
                    <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs space-y-0.5 text-gray-700">
                      <p>checkout.session.completed</p>
                      <p>invoice.paid</p>
                      <p>invoice.payment_failed</p>
                      <p>customer.subscription.deleted</p>
                      <p>customer.subscription.updated</p>
                    </div>
                    <p className="text-gray-600 text-xs">Copie o <strong>Signing secret</strong> para:</p>
                    <div className="bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400">
                      STRIPE_WEBHOOK_SECRET="whsec_..."
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 5 — teste local */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Testar localmente (opcional)</div>
                  <p className="text-sm text-gray-500 mb-2">Use o Stripe CLI para redirecionar webhooks para localhost.</p>
                  <div className="bg-gray-900 rounded-xl p-3 text-xs font-mono text-green-400 space-y-1">
                    <p><span className="text-gray-500"># Instalar Stripe CLI: stripe.com/docs/stripe-cli</span></p>
                    <p>stripe login</p>
                    <p>stripe listen --forward-to localhost:3001/api/stripe/webhook</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">O CLI vai mostrar o webhook secret para usar no .env durante testes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Planos e preços */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Planos configurados</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(PLANOS).map(([id, p]) => (
                <div key={id} className="p-3 bg-gray-50 rounded-xl text-center">
                  <div className="font-semibold text-gray-800 text-sm">{p.nome}</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {p.preco === 0 ? 'Grátis' : formatPrice(p.preco)}
                  </div>
                  {p.preco > 0 && <div className="text-xs text-gray-400">/mês</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Últimas transações */}
          {recentSubs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Últimas transações</h2>
              <div className="space-y-2">
                {recentSubs.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      sub.status === 'ACTIVE' ? 'bg-green-500' :
                      sub.status === 'CANCELED' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{sub.user.name}</div>
                      <div className="text-xs text-gray-400">{sub.user.email}</div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs font-semibold text-gray-700">{sub.plan}</div>
                      <div className="text-xs text-gray-400">{sub.status}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {formatPrice(sub.amountPaid * 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
