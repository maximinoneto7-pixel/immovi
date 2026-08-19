import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export const PLANOS = {
  BASIC: {
    id: 'BASIC',
    nome: 'Básico',
    preco: 0,
    anuncios: 1,
    destaques: 0,
    foguetes: 0,
    verificacao: false,
    cor: 'gray',
    descricao: 'Para quem quer anunciar um imóvel gratuitamente',
    recursos: [
      '1 anúncio ativo',
      'Fotos ilimitadas',
      'Chat com interessados',
      'Visibilidade padrão',
    ],
  },
  DESTAQUE: {
    id: 'DESTAQUE',
    nome: 'Destaque',
    preco: 9900, // centavos = R$ 99
    anuncios: 5,
    destaques: 1,
    foguetes: 1,
    verificacao: true,
    cor: 'blue',
    stripePriceId: process.env.STRIPE_PRICE_DESTAQUE,
    descricao: 'Para vendedores particulares que querem mais visibilidade',
    recursos: [
      'Até 5 anúncios ativos',
      'Badge "Verificado"',
      '1 anúncio em destaque',
      '1 Foguete por mês',
      'Prioridade nos resultados',
      'Suporte por e-mail',
    ],
  },
  PROFISSIONAL: {
    id: 'PROFISSIONAL',
    nome: 'Profissional',
    preco: 19900, // R$ 199
    anuncios: 20,
    destaques: 5,
    foguetes: 3,
    verificacao: true,
    cor: 'violet',
    stripePriceId: process.env.STRIPE_PRICE_PROFISSIONAL,
    descricao: 'Para corretores autônomos',
    recursos: [
      'Até 20 anúncios ativos',
      'Badge "Corretor Verificado" + CRECI',
      '5 destaques simultâneos',
      '3 Foguetes por mês',
      'Relatório de visualizações',
      'Suporte prioritário',
      'Contrato digital incluso',
    ],
  },
  IMOBILIARIA: {
    id: 'IMOBILIARIA',
    nome: 'Imobiliária',
    preco: 49900, // R$ 499
    anuncios: 999,
    destaques: 20,
    foguetes: 10,
    verificacao: true,
    cor: 'amber',
    stripePriceId: process.env.STRIPE_PRICE_IMOBILIARIA,
    descricao: 'Para imobiliárias e equipes de corretores',
    recursos: [
      'Anúncios ilimitados',
      'Página da imobiliária',
      '20 destaques simultâneos',
      '10 Foguetes por mês',
      'Multi-usuários (até 10 corretores)',
      'API de integração',
      'Gerente de conta dedicado',
    ],
  },
} as const

export type PlanoId = keyof typeof PLANOS

export const FOGUETES = {
  FOGUETE_7: { id: 'FOGUETE_7', dias: 7, preco: 2900, label: '7 dias', stripePriceId: process.env.STRIPE_PRICE_FOGUETE_7 },
  FOGUETE_15: { id: 'FOGUETE_15', dias: 15, preco: 4900, label: '15 dias', stripePriceId: process.env.STRIPE_PRICE_FOGUETE_15 },
  FOGUETE_30: { id: 'FOGUETE_30', dias: 30, preco: 7900, label: '30 dias', stripePriceId: process.env.STRIPE_PRICE_FOGUETE_30 },
} as const

export function formatPrice(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}
