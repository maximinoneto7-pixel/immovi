import Link from 'next/link'
import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import {
  Video, CheckCircle2, AlertTriangle, Camera, Smartphone,
  Sun, Move, Clock, Volume2, ArrowRight, Lightbulb, Home,
  Eye, RotateCw, ChevronRight,
} from 'lucide-react'

export default async function GuiaVideoPage() {
  const session = await auth()

  const steps = [
    {
      step: '1',
      icon: Sun,
      color: 'amber',
      title: 'Escolha o horário certo',
      desc: 'Grave sempre com luz natural abundante. O melhor horário é entre 9h e 16h em dias com sol.',
      tips: [
        'Abra todas as janelas e cortinas antes de gravar',
        'Evite gravar contra a luz (janelas atrás de você)',
        'Ligue todas as luzes artificiais mesmo de dia',
        'Dias nublados também funcionam — a luz é difusa e uniforme',
      ],
      doNot: 'Nunca grave à noite ou com iluminação fraca',
    },
    {
      step: '2',
      icon: Home,
      color: 'blue',
      title: 'Prepare o ambiente',
      desc: 'Um imóvel organizado e limpo vende muito mais. Dedique 30 minutos antes de gravar.',
      tips: [
        'Retire objetos pessoais (fotos, roupas, utensílios)',
        'Organize travesseiros, almofadas e lençóis',
        'Retire lixeiras, varredor e objetos do chão',
        'Coloque flores ou plantas para dar vida ao ambiente',
        'Deixe tampas de vasos fechadas',
      ],
      doNot: 'Não grave com desordem, louça suja ou roupas espalhadas',
    },
    {
      step: '3',
      icon: Smartphone,
      color: 'green',
      title: 'Configure o celular corretamente',
      desc: 'Use o celular na horizontal (paisagem) e configure para a maior qualidade disponível.',
      tips: [
        'Sempre grave na horizontal — nunca vertical',
        'Use resolução mínima de 1080p (Full HD)',
        'Ative o estabilizador de imagem (OIS/EIS)',
        'Limpe a lente da câmera com um pano macio',
        'Desative as notificações durante a gravação',
        'Use o espaço traseiro (câmera principal) para melhor qualidade',
      ],
      doNot: 'Nunca grave com o celular na vertical — parece amador',
    },
    {
      step: '4',
      icon: Move,
      color: 'violet',
      title: 'A técnica de movimento imersivo',
      desc: 'O segredo é fazer o espectador "entrar" no imóvel. Simule como uma pessoa caminharia naturalmente.',
      tips: [
        'Comece do lado de fora (rua/entrada) e entre devagar',
        'Mova a câmera lentamente — máx. 1 passo por segundo',
        'Passe pela porta de cada cômodo como se estivesse entrando',
        'Faça uma volta de 180° lento em cada cômodo para mostrar tudo',
        'Vire a câmera para o teto brevemente para mostrar o pé-direito',
        'Abra gavetas, armários e o quintal naturalmente',
      ],
      doNot: 'Evite movimentos bruscos, sacudidas e cortes abruptos',
    },
    {
      step: '5',
      icon: RotateCw,
      color: 'teal',
      title: 'Sequência ideal de filmagem',
      desc: 'Siga uma ordem lógica que reproduz como um comprador visitaria o imóvel na vida real.',
      tips: [
        '1. Fachada / entrada do imóvel (vista externa)',
        '2. Hall de entrada / sala de estar',
        '3. Sala de jantar / cozinha',
        '4. Área de serviço / quintal',
        '5. Corredor para os quartos',
        '6. Quartos (do maior para o menor)',
        '7. Banheiros',
        '8. Garagem / área de lazer',
        '9. Vista da janela mais bonita',
      ],
      doNot: 'Não pule cômodos nem filme na ordem errada — confunde quem assiste',
    },
    {
      step: '6',
      icon: Volume2,
      color: 'red',
      title: 'Áudio e narração',
      desc: 'Uma narração calma e descritiva cria muito mais conexão do que silêncio.',
      tips: [
        'Fale em tom tranquilo e descritivo enquanto filma',
        'Diga o que está mostrando: "Esta é a cozinha americana com bancada de granito..."',
        'Mencione pontos positivos: "Aqui entra muito sol pela manhã"',
        'Conte algo especial: "Este jardim tem uma mangueira que dá frutos todo ano"',
        'Grave em ambiente silencioso — feche portas para ruas barulhentas',
      ],
      doNot: 'Não fique em silêncio total — a narração humaniza o imóvel',
    },
    {
      step: '7',
      icon: Clock,
      color: 'orange',
      title: 'Duração e edição',
      desc: 'O vídeo ideal tem entre 3 e 5 minutos. Suficiente para mostrar tudo sem cansar.',
      tips: [
        'Máximo 5 minutos — vídeos longos perdem a atenção',
        'Cada cômodo: 20 a 40 segundos',
        'Não corte abruptamente — deixe 2 segundos de margem em cada cena',
        'Se possível, coloque uma música ambiente suave de fundo',
        'Use aplicativos gratuitos: CapCut, InShot ou iMovie',
      ],
      doNot: 'Vídeos de 15 minutos afastam compradores — seja objetivo',
    },
  ]

  const colorMap: Record<string, { bg: string; text: string; num: string }> = {
    amber:  { bg: 'bg-amber-100',  text: 'text-amber-600',  num: 'bg-amber-500' },
    blue:   { bg: 'bg-indigo-100',   text: 'text-indigo-600',   num: 'bg-indigo-600' },
    green:  { bg: 'bg-green-100',  text: 'text-green-600',  num: 'bg-green-600' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', num: 'bg-violet-600' },
    teal:   { bg: 'bg-teal-100',   text: 'text-teal-600',   num: 'bg-teal-600' },
    red:    { bg: 'bg-red-100',    text: 'text-red-500',    num: 'bg-red-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', num: 'bg-orange-500' },
  }

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-indigo-900 to-indigo-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-9 h-9 text-indigo-300" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Como gravar um vídeo imersivo do seu imóvel
            </h1>
            <p className="text-indigo-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Imóveis com vídeo bem gravado recebem <strong className="text-white">até 4x mais contatos</strong>.
              Siga este guia e faça o comprador sentir que já está dentro da casa.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                { icon: Eye, label: '4x mais visualizações' },
                { icon: Clock, label: '3 a 5 minutos ideal' },
                { icon: Smartphone, label: 'Só precisa do celular' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
                  <item.icon className="w-4 h-4 text-indigo-300" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Checklist rápido */}
        <section className="bg-green-50 border-b border-green-100 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-3">
              <CheckCircle2 className="w-4 h-4" /> Checklist antes de começar
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                'Imóvel limpo e organizado',
                'Luz natural abundante',
                'Celular com bateria cheia',
                'Câmera limpa e horizontal',
                'Notificações desligadas',
                'Todas as luzes acesas',
                'Cortinas abertas',
                'Ambiente silencioso',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-green-800 bg-white rounded-xl px-3 py-2 border border-green-100">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Passos */}
        <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          {steps.map((s) => {
            const c = colorMap[s.color]
            return (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.bg} ${c.text}`}>
                      <s.icon className="w-7 h-7" />
                    </div>
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${c.num}`}>
                      {s.step}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{s.title}</h2>
                    <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  {/* Dicas */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold uppercase tracking-wide mb-3">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Faça assim
                    </div>
                    <ul className="space-y-2">
                      {s.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Evitar */}
                  <div className="p-5 bg-red-50">
                    <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold uppercase tracking-wide mb-3">
                      <AlertTriangle className="w-3.5 h-3.5" /> Evite
                    </div>
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />
                      {s.doNot}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        {/* Dica de ouro */}
        <section className="bg-amber-50 border-y border-amber-100 py-10">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Lightbulb className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">A dica de ouro</h2>
            <p className="text-gray-700 leading-relaxed text-lg italic">
              "Imagine que você está levando um amigo de confiança para conhecer o imóvel.
              Mostre tudo que você ama, conte o que é especial, seja natural.
              Essa autenticidade é o que faz o comprador se conectar e ligar."
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Pronto para anunciar?</h2>
          <p className="text-gray-500 mb-6">
            Agora que você sabe como gravar, crie seu anúncio e adicione o vídeo do imóvel.
          </p>
          <Link
            href="/imoveis/novo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-lg"
          >
            Anunciar meu imóvel
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
