import Link from 'next/link'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { vagasRestantes } from '@/lib/trial'
import { PLANOS } from '@/lib/stripe'
import {
  MessageCircle, ArrowUpRight, Rocket, BarChart3, FileText,
  BadgeCheck, Search, Check, X,
} from 'lucide-react'

export const metadata = {
  title: 'Para corretores | Immovi',
  description:
    'O contato do interessado chega direto no seu WhatsApp, sem passar por intermediário. 60 dias do plano Destaque, sem cartão.',
}

const WHATSAPP = 'https://wa.me/556294263425?text=' + encodeURIComponent(
  'Olá! Sou corretor(a) e vi a página da Immovi para corretores. Queria entender melhor antes de criar conta.'
)

const GANHOS = [
  {
    icon: MessageCircle,
    titulo: 'O interessado fala no seu WhatsApp',
    texto:
      'Você liga a opção no perfil e o botão aparece no seu anúncio. Quem se interessou chama você direto, ' +
      'sem passar por ninguém. Se preferir não expor o número, é só deixar desligado e usar o chat do site.',
  },
  {
    icon: Search,
    titulo: 'Seus anúncios aparecem antes',
    texto:
      'Quem assina sobe nos resultados de busca. Não é sorteio nem leilão de lance: é posição fixa por plano, ' +
      'e os Foguetes sobem ainda mais o anúncio que você quiser destacar na semana.',
  },
  {
    icon: Rocket,
    titulo: 'Foguetes já vêm no plano',
    texto:
      'O Profissional inclui 3 por mês, de 7 dias cada, sem comprar à parte. Serve para empurrar o imóvel ' +
      'que está parado ou aquele que o dono está cobrando resposta.',
  },
  {
    icon: BarChart3,
    titulo: 'Relatório por anúncio',
    texto:
      'Quantas pessoas viram a cada dia, de onde vieram, quantas favoritaram, conversaram, pediram visita ' +
      'ou mandaram proposta. É o que você mostra para o proprietário quando ele pergunta se está andando.',
  },
  {
    icon: FileText,
    titulo: 'Contrato digital ilimitado',
    texto:
      'Compra e venda, locação, permuta e cessão, preenchidos com os dados do imóvel e das partes. ' +
      'Sem cobrança por documento gerado.',
  },
  {
    icon: BadgeCheck,
    titulo: 'Selo de CRECI conferido',
    texto:
      'Você envia o número e a gente confere. O selo aparece no seu perfil e nos seus anúncios — ' +
      'quem está do outro lado vê que está falando com profissional registrado.',
  },
]

const COMPARACAO = [
  { tema: 'O contato do interessado', portais: 'Fica com a plataforma, que repassa como lead', aqui: 'Vai direto para o seu WhatsApp' },
  { tema: 'Como se paga', portais: 'Por lead recebido, ou pacote com fidelidade', aqui: 'Mensalidade fixa, cancela quando quiser' },
  { tema: 'Posição na busca', portais: 'Leilão: quem paga mais na hora aparece mais', aqui: 'Posição fixa pelo plano, sem disputa de lance' },
  { tema: 'Contrato', portais: 'Por fora, com quem você contratar', aqui: 'Incluído, sem limite de documentos' },
]

export default async function CorretoresPage() {
  const session = await auth()
  const vagas = await vagasRestantes()
  const destaque = PLANOS.DESTAQUE

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold mb-5">
              <MessageCircle className="w-3.5 h-3.5 text-green-400" />
              Para corretores e imobiliárias
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-5">
              O WhatsApp do seu anúncio é seu
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
              Nos portais grandes, o contato de quem se interessou pelo seu imóvel fica com a plataforma e
              volta para você como “lead”, cobrado à parte. Aqui não tem intermediário: quem gostou do
              anúncio chama você no WhatsApp e vocês resolvem entre si.
            </p>
          </div>
        </section>

        {/* A verdade sobre o tamanho da plataforma */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8">
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-2">Antes de tudo, o que você precisa saber</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              A Immovi está começando. Se você abrir a busca agora, vai encontrar poucos imóveis — e nós
              preferimos que você saiba disso por aqui do que descubra sozinho depois de criar conta.
              É exatamente por isso que estamos liberando tudo de graça neste começo: precisamos de
              anunciantes bons antes de ter movimento, não o contrário. Quem entrar agora vai estar no topo
              de uma plataforma pequena, em vez de disputar espaço numa cheia.
            </p>
          </div>
        </section>

        {/* O que você ganha */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">O que você tem aqui</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GANHOS.map((g) => (
              <div key={g.titulo} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <g.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{g.titulo}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{g.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparação */}
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">A diferença, em quatro linhas</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              Comparação com o modelo dos grandes portais imobiliários.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide"></th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      Portal tradicional
                    </th>
                    <th className="text-left py-3 pl-4 font-semibold text-indigo-700 text-xs uppercase tracking-wide">
                      Immovi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {COMPARACAO.map((c) => (
                    <tr key={c.tema}>
                      <td className="py-4 pr-4 font-semibold text-gray-900 align-top">{c.tema}</td>
                      <td className="py-4 px-4 text-gray-500 align-top">
                        <span className="flex items-start gap-2">
                          <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                          {c.portais}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-gray-800 align-top">
                        <span className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {c.aqui}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Oferta e chamada */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-7 text-center">
            {vagas > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  60 dias do plano {destaque.nome}, sem cartão
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Oferta de abertura. Você usa o plano completo por 60 dias sem cadastrar cartão e sem
                  cobrança automática — no fim, a conta volta sozinha para o gratuito se você não quiser
                  continuar. Precisando de mais anúncios do que o Destaque permite, fale comigo que eu
                  libero o plano certo para o seu caso.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Comece de graça, com 5 anúncios
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  O plano gratuito está liberado com 5 anúncios ativos durante o lançamento. Precisando de
                  mais, fale comigo que a gente resolve.
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/cadastro?perfil=corretor"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Criar minha conta
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                Prefere falar comigo antes?
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-5">
              Sem fidelidade, sem multa e sem cobrança automática na oferta de abertura.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/planos" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Ver todos os planos e preços →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
