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
      'Você liga a opção no perfil e o botão aparece no seu anúncio. Quem se interessou chama você direto. ' +
      'Se preferir não expor o número, é só deixar desligado e usar o chat do site.',
  },
  {
    icon: Search,
    titulo: 'Seus anúncios aparecem antes',
    texto:
      'Quem assina sobe nos resultados de busca. Não é leilão de lance: é posição fixa por plano, e os ' +
      'Foguetes sobem ainda mais o anúncio que você quiser destacar na semana.',
  },
  {
    icon: Rocket,
    titulo: 'Foguetes já vêm no plano',
    texto:
      'O Profissional inclui 3 por mês, de 7 dias cada, sem comprar à parte. Serve para empurrar o imóvel ' +
      'parado ou aquele que o dono está cobrando resposta.',
  },
  {
    icon: BarChart3,
    titulo: 'Relatório por anúncio',
    texto:
      'Quantas pessoas viram a cada dia, de onde vieram, quantas favoritaram, conversaram, pediram visita ' +
      'ou mandaram proposta. É o que você mostra ao proprietário quando ele pergunta se está andando.',
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
      'quem está do outro lado vê que fala com profissional registrado.',
  },
]

const COMPARACAO = [
  { tema: 'O contato do interessado', portais: 'Fica com a plataforma, que repassa como lead', aqui: 'Vai direto para o seu WhatsApp' },
  { tema: 'Como se paga', portais: 'Por lead recebido, ou pacote com fidelidade', aqui: 'Mensalidade fixa, cancela quando quiser' },
  { tema: 'Posição na busca', portais: 'Leilão: quem paga mais na hora aparece mais', aqui: 'Posição fixa pelo plano, sem disputa de lance' },
  { tema: 'Contrato', portais: 'Por fora, com quem você contratar', aqui: 'Incluído, sem limite de documentos' },
]

/** Moldura de navegador em volta de uma tela do sistema */
function Janela({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-7 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-3">
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="w-2 h-2 rounded-full bg-gray-300" />
      </div>
      <div className="h-52 p-4">{children}</div>
      <div className="px-4 py-3 border-t border-gray-100 text-sm font-semibold text-gray-900">{titulo}</div>
    </div>
  )
}

export default async function CorretoresPage() {
  const session = await auth()
  const vagas = await vagasRestantes()
  const destaque = PLANOS.DESTAQUE

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-white">

        {/* Hero: o argumento à esquerda, o produto à direita */}
        <section className="bg-gradient-to-br from-gray-900 via-indigo-950 to-indigo-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col lg:flex-row items-center gap-12">

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full text-xs font-semibold mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                Para corretores e imobiliárias
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-5">
                Seu cliente chama<br className="hidden sm:block" /> direto no seu WhatsApp
              </h1>
              <p className="text-indigo-100 text-lg leading-relaxed max-w-md mb-8">
                Sem virar “lead” cobrado à parte. O botão aparece no seu anúncio, a conversa é sua, e o
                negócio se resolve entre vocês dois.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cadastro?perfil=corretor"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Criar minha conta
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar comigo antes
                </a>
              </div>
            </div>

            {/* O anúncio como ele fica */}
            <div className="flex-none w-[300px] sm:w-[320px]">
              <div className="bg-gray-950 rounded-[2.2rem] p-2.5 shadow-2xl">
                <div className="bg-gray-50 rounded-[1.7rem] overflow-hidden">
                  <div className="h-36 bg-gradient-to-br from-gray-300 to-gray-400 flex items-end p-2.5">
                    <span className="text-[10px] text-gray-700 bg-white/80 px-2 py-0.5 rounded-md">
                      foto do imóvel
                    </span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="text-xl font-bold text-gray-900 tracking-tight">R$ 450.000</div>
                    <div className="text-xs text-gray-600 leading-snug">
                      Chácara com 2 alqueires, casa sede e represa
                    </div>
                    <div className="text-[11px] text-gray-400">Ivolândia · GO</div>

                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      <div className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-3 text-sm font-bold ring-4 ring-[#25D366]/25">
                        <MessageCircle className="w-4 h-4" />
                        Falar no WhatsApp
                      </div>
                      <div className="flex items-center justify-center border border-gray-200 text-gray-500 rounded-xl py-2.5 text-xs">
                        Mensagem pelo chat
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-indigo-200/70 mt-3">
                É assim que o seu anúncio fica, se você quiser.
              </p>
            </div>
          </div>
        </section>

        {/* A verdade sobre o tamanho da plataforma */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-7 relative">
          <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6">
            <h2 className="font-bold text-amber-900 mb-1.5">Antes de tudo: a Immovi está começando</h2>
            <p className="text-sm text-amber-800 leading-relaxed">
              Se você abrir a busca agora, vai encontrar poucos imóveis — e nós preferimos que saiba disso
              por aqui do que descubra sozinho depois de criar conta. É exatamente por isso que estamos
              liberando tudo de graça neste começo: precisamos de bons anunciantes antes de ter movimento,
              não o contrário. Quem entrar agora fica no topo de uma plataforma pequena, em vez de disputar
              espaço numa cheia.
            </p>
          </div>
        </section>

        {/* O sistema, antes de criar conta */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Veja antes de criar conta</h2>
          <p className="text-gray-500 mb-8">O que você vai usar no dia a dia, sem precisar se cadastrar para descobrir.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Janela titulo="Anúncio com botão de WhatsApp">
              <div className="h-full flex flex-col gap-2">
                <div className="h-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="h-2.5 w-3/4 rounded bg-gray-200" />
                <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                <div className="mt-auto h-9 rounded-lg bg-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </Janela>

            <Janela titulo="Relatório de cada anúncio">
              <div className="h-full flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded-lg bg-indigo-50" />
                  <div className="flex-1 h-10 rounded-lg bg-rose-50" />
                  <div className="flex-1 h-10 rounded-lg bg-emerald-50" />
                </div>
                <div className="flex-1 flex items-end gap-1.5">
                  {[24, 52, 38, 74, 61, 88].map((h, i) => (
                    <div key={i} className="flex-1 bg-indigo-500 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </Janela>

            <Janela titulo="Foguete incluso no plano">
              <div className="h-full flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Rocket className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="h-2.5 flex-1 rounded bg-gray-100" />
                </div>
                <div className="h-9 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                <div className="h-9 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                <div className="mt-auto h-9 rounded-lg bg-indigo-600" />
              </div>
            </Janela>
          </div>
        </section>

        {/* O que você tem aqui */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8 text-center">O que você tem aqui</h2>
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
          </div>
        </section>

        {/* Comparação */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1 text-center">A diferença, em quatro linhas</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Comparação com o modelo dos grandes portais imobiliários.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-4"><span className="sr-only">Assunto</span></th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Portal tradicional</th>
                  <th className="text-left py-3 pl-4 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Immovi</th>
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
        </section>

        {/* Oferta */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {vagas > 0
                  ? `60 dias do plano ${destaque.nome}, sem cartão`
                  : 'Comece de graça, com 5 anúncios'}
              </h2>
              <p className="text-indigo-100 leading-relaxed">
                {vagas > 0
                  ? 'Oferta de abertura: você usa o plano completo por 60 dias sem cadastrar cartão e sem cobrança automática. No fim, a conta volta sozinha para o gratuito se você não quiser continuar. Precisando de mais anúncios, fale comigo que eu libero o plano certo.'
                  : 'O plano gratuito está liberado com 5 anúncios ativos durante o lançamento. Precisando de mais, fale comigo que a gente resolve.'}
              </p>
            </div>
            <div className="flex-none flex flex-col gap-2.5 sm:w-56">
              <Link
                href="/cadastro?perfil=corretor"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Criar minha conta
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Falar comigo antes
              </a>
              <p className="text-[11px] text-indigo-200/70 text-center leading-relaxed mt-1">
                Sem fidelidade e sem multa.
              </p>
            </div>
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
