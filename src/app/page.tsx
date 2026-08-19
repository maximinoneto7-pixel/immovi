import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/common/SearchBar'
import PropertyCard from '@/components/imoveis/PropertyCard'
import ScrollReveal from '@/components/common/ScrollReveal'
import {
  Shield,
  MessageCircle,
  FileText,
  TrendingUp,
  Home,
  Trees,
  Building2,
  MapPin,
  Star,
  ChevronRight,
  CheckCircle2,
  Users,
  Handshake,
  Heart,
} from 'lucide-react'

async function getFeaturedProperties() {
  return prisma.property.findMany({
    where: { status: 'ACTIVE', featured: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, image: true, verified: true } },
      images: { orderBy: { order: 'asc' } },
      features: true,
    },
  })
}

async function getRecentProperties() {
  return prisma.property.findMany({
    where: { status: 'ACTIVE' },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, image: true, verified: true } },
      images: { orderBy: { order: 'asc' } },
      features: true,
    },
  })
}

async function getStats() {
  const [properties, users] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
  ])
  return { properties, users }
}

export default async function HomePage() {
  const session = await auth()
  const [featured, recent, stats] = await Promise.all([
    getFeaturedProperties(),
    getRecentProperties(),
    getStats(),
  ])

  const typeLinks = [
    { href: '/imoveis?type=HOUSE', label: 'Casas', icon: Home, bg: 'bg-indigo-100 group-hover:bg-indigo-600', text: 'text-indigo-600 group-hover:text-white' },
    { href: '/imoveis?type=APARTMENT', label: 'Apartamentos', icon: Building2, bg: 'bg-violet-100 group-hover:bg-violet-600', text: 'text-violet-600 group-hover:text-white' },
    { href: '/imoveis?type=FARM', label: 'Fazendas', icon: Trees, bg: 'bg-green-100 group-hover:bg-green-600', text: 'text-green-600 group-hover:text-white' },
    { href: '/imoveis?type=LAND', label: 'Terrenos', icon: MapPin, bg: 'bg-amber-100 group-hover:bg-amber-500', text: 'text-amber-600 group-hover:text-white' },
  ]

  const diferenciais = [
    { icon: Users, bg: 'bg-indigo-100', text: 'text-indigo-600', title: 'Contato Direto', desc: 'Fale diretamente com o proprietário ou comprador, sem intermediários que encarecem e complicam.' },
    { icon: Shield, bg: 'bg-green-100', text: 'text-green-600', title: 'Perfis Verificados', desc: 'Todos os usuários passam por verificação de identidade. Você sabe com quem está negociando.' },
    { icon: Heart, bg: 'bg-red-100', text: 'text-red-500', title: 'História do Imóvel', desc: 'O vendedor conta a história do lugar — o que ama, a vizinhança, a rotina. Humanidade real.' },
    { icon: MessageCircle, bg: 'bg-violet-100', text: 'text-violet-600', title: 'Chat Seguro', desc: 'Sistema de mensagens integrado. Histórico de conversas preservado e protegido na plataforma.' },
    { icon: FileText, bg: 'bg-amber-100', text: 'text-amber-600', title: 'Contrato Digital', desc: 'Assine contratos com validade jurídica diretamente na plataforma, sem complicação.' },
    { icon: TrendingUp, bg: 'bg-teal-100', text: 'text-teal-600', title: 'Sem Taxa Obrigatória', desc: 'Negociação direta sem taxa de corretagem obrigatória. Você economiza e negocia com mais liberdade.' },
  ]

  return (
    <>
      <Header user={session?.user as any} />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-28 sm:pb-36">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium text-indigo-100 mb-6">
                <Shield className="w-4 h-4" />
                Plataforma 100% Verificada e Segura
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Encontre seu imóvel com{' '}
                <span className="text-amber-400">história e confiança</span>
              </h1>
              <p className="text-lg sm:text-xl text-indigo-100 mb-10 leading-relaxed">
                Conectamos compradores e vendedores diretamente, com transparência e humanidade.
                Sem intermediários desnecessários, com perfis verificados e negociações seguras.
              </p>
              <SearchBar className="max-w-3xl mx-auto" />
              <div className="flex flex-wrap items-center justify-center gap-8 mt-10 text-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.properties.toLocaleString('pt-BR')}+</div>
                  <div className="text-indigo-200">Imóveis ativos</div>
                </div>
                <div className="w-px h-10 bg-white/20 hidden sm:block" />
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.users.toLocaleString('pt-BR')}+</div>
                  <div className="text-indigo-200">Usuários cadastrados</div>
                </div>
                <div className="w-px h-10 bg-white/20 hidden sm:block" />
                <div className="text-center">
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-indigo-200">Negociações diretas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Curva de transição suave para a próxima seção */}
          <div className="absolute bottom-0 left-0 right-0 leading-none pointer-events-none">
            <svg viewBox="0 0 1440 80" className="w-full h-14 sm:h-20" preserveAspectRatio="none">
              <path d="M0,32 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="#f7f9fc" />
            </svg>
          </div>
        </section>

        {/* CATEGORIAS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {typeLinks.map((item, i) => (
              <ScrollReveal key={item.href} delay={i * 60}>
                <Link href={item.href}
                  className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${item.bg} ${item.text}`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900">{item.label}</span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* DESTAQUES */}
        {featured.length > 0 && (
          <section className="py-14 border-y border-amber-100/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold mb-1">
                      <Star className="w-4 h-4 fill-current" /> Imóveis em Destaque
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Oportunidades selecionadas</h2>
                  </div>
                  <Link href="/imoveis?featured=true" className="hidden sm:flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-700">
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((p, i) => (
                  <ScrollReveal key={p.id} delay={i * 60}>
                    <PropertyCard property={p as any} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* DIFERENCIAIS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Por que usar o Immovi?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Fazemos diferente dos portais tradicionais — aqui cada imóvel tem uma história e cada negociação é tratada com cuidado.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diferenciais.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 60}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.bg} ${item.text}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* RECENTES */}
        {recent.length > 0 && (
          <section className="py-14 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-sm font-semibold text-indigo-600 mb-1">Recém Publicados</div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Novidades da semana</h2>
                  </div>
                  <Link href="/imoveis" className="hidden sm:flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-700">
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {recent.map((p, i) => (
                  <ScrollReveal key={p.id} delay={i * 60}>
                    <PropertyCard property={p as any} />
                  </ScrollReveal>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/imoveis" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
                  Ver todos os imóveis <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* COMO FUNCIONA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Como funciona</h2>
              <p className="text-gray-500">Simples, seguro e direto ao ponto</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Home, title: 'Anuncie ou Busque', desc: 'Cadastre seu imóvel com fotos e a história do lugar — ou busque o imóvel dos seus sonhos com filtros avançados.' },
              { step: '2', icon: MessageCircle, title: 'Conecte-se', desc: 'Entre em contato diretamente com o proprietário pelo chat seguro da plataforma. Tire dúvidas, agende visitas.' },
              { step: '3', icon: Handshake, title: 'Feche com Segurança', desc: 'Use nossos serviços de contrato digital, vistoria e assessoria jurídica para fechar o negócio com total segurança.' },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 100}>
                <div className="text-center relative">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!session && (
          <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-16">
            <div className="max-w-3xl mx-auto px-4 text-center text-white">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-indigo-200" />
              <h2 className="text-3xl font-bold mb-3">Pronto para começar?</h2>
              <p className="text-indigo-100 mb-8 text-lg">Cadastre-se gratuitamente e encontre ou anuncie seu imóvel com confiança.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/cadastro" className="px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                  Criar conta gratuita
                </Link>
                <Link href="/imoveis" className="px-8 py-3.5 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-colors border border-indigo-400">
                  Explorar imóveis
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}
