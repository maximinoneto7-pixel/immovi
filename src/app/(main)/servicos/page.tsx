import Link from 'next/link'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FinanciamentoSimulator from '@/components/servicos/FinanciamentoSimulator'
import SolicitacaoForm from '@/components/servicos/SolicitacaoForm'
import {
  FileText, Shield, Wrench, Home, Scale, ChevronRight, CheckCircle2,
  Calculator, Handshake,
} from 'lucide-react'

export default async function ServicosPage() {
  const session = await auth()

  const services = [
    {
      id: 'financiamento',
      icon: Calculator,
      color: 'blue',
      title: 'Simulação de Financiamento',
      desc: 'Simule seu financiamento imobiliário em segundos. Veja parcelas, taxas e compare bancos parceiros.',
      features: ['Simulação gratuita', 'Múltiplos bancos', 'Taxa personalizada', 'Resultado imediato'],
      cta: 'Simular agora',
      href: '/calculadora',
      active: false,
    },
    {
      id: 'contrato',
      icon: FileText,
      color: 'green',
      title: 'Contrato Digital',
      desc: 'Gere contratos de compra, venda e locação com validade jurídica, sem sair de casa.',
      features: ['Validade jurídica', 'Modelos prontos', 'Cláusulas completas', 'Impressão em PDF'],
      cta: 'Criar contrato',
      href: '/contratos/novo',
      active: true,
    },
    {
      id: 'vistoria',
      icon: Wrench,
      color: 'amber',
      title: 'Vistoria Profissional',
      desc: 'Profissionais certificados vistoriam o imóvel e emitem laudo técnico completo.',
      features: ['Profissional certificado', 'Laudo técnico', 'Agendamento online', 'Resultado em 48h'],
      cta: 'Agendar vistoria',
      href: '#',
      active: false,
    },
    {
      id: 'seguro',
      icon: Shield,
      color: 'violet',
      title: 'Seguro Imobiliário',
      desc: 'Proteção completa para seu imóvel. Incêndio, roubo, danos elétricos e muito mais.',
      features: ['Múltiplas coberturas', 'Parceiros certificados', 'Contratação online', 'Assistência 24h'],
      cta: 'Cotar seguro',
      href: '#',
      active: false,
    },
    {
      id: 'juridico',
      icon: Scale,
      color: 'red',
      title: 'Assessoria Jurídica',
      desc: 'Advogados especializados em direito imobiliário para revisar contratos e orientar negociações.',
      features: ['Advogado especialista', 'Revisão de contratos', 'Orientação jurídica', '1ª consulta grátis'],
      cta: 'Falar com advogado',
      href: '#',
      active: false,
    },
    {
      id: 'avaliacao',
      icon: Home,
      color: 'teal',
      title: 'Avaliação de Imóvel',
      desc: 'Descubra o valor justo de mercado do seu imóvel com uma avaliação técnica profissional.',
      features: ['Avaliador credenciado', 'Laudo ABNT', 'Prazo de 5 dias', 'Para venda ou financiamento'],
      cta: 'Solicitar avaliação',
      href: '#',
      active: false,
    },
  ]

  const colorMap: Record<string, { bg: string; text: string; border: string; btn: string }> = {
    blue: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', btn: 'bg-green-600 hover:bg-green-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', btn: 'bg-amber-500 hover:bg-amber-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', btn: 'bg-violet-600 hover:bg-violet-700' },
    red: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', btn: 'bg-red-500 hover:bg-red-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', btn: 'bg-teal-600 hover:bg-teal-700' },
  }

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-300 text-sm font-medium mb-4">
              <Handshake className="w-4 h-4" />
              Serviços integrados
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa para fechar com segurança
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Do financiamento à assinatura do contrato, temos parceiros especializados para cada etapa da sua negociação imobiliária.
            </p>
          </div>
        </section>

        {/* Simulador de Financiamento — em destaque */}
        <section id="financiamento" className="bg-indigo-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-3">
                <Calculator className="w-4 h-4" />
                Simulação gratuita
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Simule seu Financiamento</h2>
              <p className="text-gray-500">Descubra quanto vai pagar por mês e qual banco oferece as melhores condições</p>
            </div>
            <FinanciamentoSimulator />
          </div>
        </section>

        {/* Service cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Nossos serviços</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => {
              const c = colorMap[svc.color]
              return (
                <div
                  key={svc.id}
                  id={svc.id}
                  className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col relative overflow-hidden transition-shadow ${
                    svc.active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-80'
                  }`}
                >
                  {/* Badge Em Breve */}
                  {!svc.active && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full tracking-wide">
                      Em breve
                    </div>
                  )}

                  {/* Badge Disponível */}
                  {svc.active && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                      Disponível
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.bg} ${c.text}`}>
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{svc.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{svc.desc}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {svc.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${svc.active ? 'text-green-500' : 'text-gray-300'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {svc.active ? (
                    <Link
                      href={svc.href}
                      className={`flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-xl text-sm transition-colors ${c.btn}`}
                    >
                      {svc.cta}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl text-sm cursor-not-allowed select-none">
                      <ChevronRight className="w-4 h-4" />
                      Em breve
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Formulário de solicitação */}
        <section id="solicitar" className="bg-gradient-to-br from-indigo-50 to-indigo-100 py-14">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicite um serviço</h2>
              <p className="text-gray-500">
                Preencha o formulário e um de nossos parceiros especializados entrará em contato em até 24h.
              </p>
            </div>
            <SolicitacaoForm />
          </div>
        </section>

        {/* Trust badges */}
        <section className="bg-gray-50 py-10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm mb-6">Parceiros confiáveis e certificados</p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm font-semibold">
              {['Banco do Brasil', 'Caixa Econômica', 'Itaú', 'Bradesco', 'Santander'].map((bank) => (
                <div key={bank} className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-600">
                  {bank}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
