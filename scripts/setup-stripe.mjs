/**
 * Script para criar os produtos e preços no Stripe automaticamente.
 * Execute: node scripts/setup-stripe.mjs
 * Pré-requisito: STRIPE_SECRET_KEY configurado no .env
 */

import 'dotenv/config'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('\n❌ STRIPE_SECRET_KEY não encontrado no .env')
  console.error('   Configure sua chave e rode novamente.\n')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')

console.log(`\n🚀 Configurando Stripe (${isTestMode ? 'MODO TESTE ✅' : 'PRODUÇÃO ⚠️'})\n`)

const PLANOS = [
  {
    id: 'DESTAQUE',
    name: 'Imóvel na Mão — Plano Destaque',
    description: 'Até 5 anúncios, 1 destaque, badge verificado',
    priceMonthly: 9900, // R$ 99,00
    envKey: 'STRIPE_PRICE_DESTAQUE',
  },
  {
    id: 'PROFISSIONAL',
    name: 'Imóvel na Mão — Plano Profissional',
    description: 'Até 20 anúncios, 5 destaques, 3 foguetes, relatórios',
    priceMonthly: 19900, // R$ 199,00
    envKey: 'STRIPE_PRICE_PROFISSIONAL',
  },
  {
    id: 'IMOBILIARIA',
    name: 'Imóvel na Mão — Plano Imobiliária',
    description: 'Anúncios ilimitados, página da imobiliária, API',
    priceMonthly: 49900, // R$ 499,00
    envKey: 'STRIPE_PRICE_IMOBILIARIA',
  },
]

const FOGUETES = [
  { id: 'FOGUETE_7', name: 'Foguete 7 dias', price: 2900, envKey: 'STRIPE_PRICE_FOGUETE_7' },
  { id: 'FOGUETE_15', name: 'Foguete 15 dias', price: 4900, envKey: 'STRIPE_PRICE_FOGUETE_15' },
  { id: 'FOGUETE_30', name: 'Foguete 30 dias', price: 7900, envKey: 'STRIPE_PRICE_FOGUETE_30' },
]

const envLines = []

// Criar planos (assinaturas recorrentes)
console.log('📦 Criando planos de assinatura...')
for (const plano of PLANOS) {
  try {
    const product = await stripe.products.create({
      name: plano.name,
      description: plano.description,
      metadata: { planId: plano.id },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plano.priceMonthly,
      currency: 'brl',
      recurring: { interval: 'month' },
      metadata: { planId: plano.id },
    })

    console.log(`  ✅ ${plano.id}: price_id = ${price.id}`)
    envLines.push(`${plano.envKey}="${price.id}"`)
  } catch (err) {
    console.error(`  ❌ Erro ao criar ${plano.id}:`, err.message)
  }
}

// Criar foguetes (pagamentos únicos)
console.log('\n🚀 Criando produtos Foguete (pagamento único)...')
for (const foguete of FOGUETES) {
  try {
    const product = await stripe.products.create({
      name: foguete.name,
      metadata: { boostType: foguete.id },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: foguete.price,
      currency: 'brl',
      metadata: { boostType: foguete.id },
    })

    console.log(`  ✅ ${foguete.id}: price_id = ${price.id}`)
    envLines.push(`${foguete.envKey}="${price.id}"`)
  } catch (err) {
    console.error(`  ❌ Erro ao criar ${foguete.id}:`, err.message)
  }
}

console.log('\n─────────────────────────────────────────────')
console.log('📋 Adicione estas linhas no seu arquivo .env:')
console.log('─────────────────────────────────────────────\n')
envLines.forEach((line) => console.log(line))
console.log('\n─────────────────────────────────────────────')
console.log('\n✅ Pronto! Agora configure o webhook:')
console.log('   1. Acesse: https://dashboard.stripe.com/webhooks')
console.log('   2. Clique em "Add endpoint"')
console.log('   3. URL: https://SEU_DOMINIO/api/stripe/webhook')
console.log('   4. Eventos: checkout.session.completed,')
console.log('              invoice.paid,')
console.log('              invoice.payment_failed,')
console.log('              customer.subscription.deleted,')
console.log('              customer.subscription.updated')
console.log('   5. Copie o "Signing secret" (whsec_...) para STRIPE_WEBHOOK_SECRET\n')

if (isTestMode) {
  console.log('💡 Para testar localmente:')
  console.log('   stripe listen --forward-to localhost:3001/api/stripe/webhook\n')
}
