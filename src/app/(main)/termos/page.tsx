import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { auth } from '@/lib/auth'
import { FileText, ChevronRight } from 'lucide-react'

const ULTIMA_ATUALIZACAO = '25 de junho de 2026'

const sections = [
  { id: 'definicoes', title: '1. Definições' },
  { id: 'aceitacao', title: '2. Aceitação dos Termos' },
  { id: 'plataforma', title: '3. Descrição da Plataforma' },
  { id: 'cadastro', title: '4. Cadastro e Conta de Usuário' },
  { id: 'anuncios', title: '5. Publicação de Anúncios' },
  { id: 'negociacoes', title: '6. Negociações entre Usuários' },
  { id: 'pagamentos', title: '7. Planos, Pagamentos e Reembolsos' },
  { id: 'conduta', title: '8. Conduta do Usuário e Usos Proibidos' },
  { id: 'verificacao', title: '9. Verificação de Documentos por IA' },
  { id: 'propriedade', title: '10. Propriedade Intelectual' },
  { id: 'responsabilidade', title: '11. Limitação de Responsabilidade' },
  { id: 'suspensao', title: '12. Suspensão e Encerramento de Conta' },
  { id: 'resolucao', title: '13. Resolução de Disputas' },
  { id: 'lei-aplicavel', title: '14. Lei Aplicável e Foro' },
  { id: 'disposicoes', title: '15. Disposições Gerais' },
]

export default async function TermosPage() {
  const session = await auth()

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-8 h-8 text-gray-300" />
              <h1 className="text-3xl font-bold">Termos de Uso</h1>
            </div>
            <p className="text-gray-300 text-lg">
              Última atualização: <strong className="text-white">{ULTIMA_ATUALIZACAO}</strong>
            </p>
            <p className="text-gray-300 mt-2 text-sm">
              Leia atentamente antes de utilizar a plataforma Immovi.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10 flex gap-8">
          {/* Índice lateral */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sumário</p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-indigo-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Conteúdo */}
          <article className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none">
            <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-gray-500 pl-4 bg-gray-50 rounded-r-xl py-3 pr-3 not-prose">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma <strong>Immovi</strong>,
              disponível em <strong>immovi.com.br</strong> e em seus aplicativos. Ao criar uma conta ou
              utilizar qualquer funcionalidade da plataforma, você declara ter lido, compreendido e aceitado
              integralmente estes Termos.
            </p>

            <section id="definicoes">
              <h2>1. Definições</h2>
              <p>Para fins destes Termos, consideram-se:</p>
              <ul>
                <li><strong>"Plataforma":</strong> o site immovi.com.br e demais aplicações da Immovi</li>
                <li><strong>"Usuário":</strong> qualquer pessoa física maior de 18 anos que se cadastre na Plataforma</li>
                <li><strong>"Anunciante":</strong> usuário que publica anúncios de imóveis (vendedor, locador ou corretor)</li>
                <li><strong>"Interessado":</strong> usuário que busca imóveis (comprador ou locatário)</li>
                <li><strong>"Corretor":</strong> usuário cadastrado com número de CRECI ativo</li>
                <li><strong>"Anúncio":</strong> publicação de oferta de venda ou locação de imóvel</li>
                <li><strong>"Foguete":</strong> funcionalidade paga de destaque temporário de anúncio</li>
                <li><strong>"Verificação":</strong> processo de análise de documentos por IA para confirmar a titularidade do imóvel</li>
                <li><strong>"Operadora":</strong> <strong>MNM Tecnologia LTDA</strong>, inscrita no CNPJ sob o
                  nº <strong>67.880.630/0001-79</strong>, pessoa jurídica responsável pela Plataforma Immovi</li>
              </ul>
            </section>

            <section id="aceitacao">
              <h2>2. Aceitação dos Termos</h2>
              <p>
                O uso da Plataforma constitui aceitação plena e irrestrita destes Termos de Uso e da{' '}
                <Link href="/privacidade" className="text-indigo-600 hover:underline">Política de Privacidade</Link>.
                Caso não concorde com qualquer disposição, o usuário deve abster-se de utilizar a Plataforma.
              </p>
              <p>
                A Operadora reserva-se o direito de modificar estes Termos a qualquer momento, comunicando as
                alterações com antecedência mínima de 15 (quinze) dias por e-mail e/ou aviso na Plataforma.
                O uso continuado após a vigência das alterações implica aceitação das novas condições.
              </p>
              <p>
                Estes Termos constituem o acordo integral entre as partes e substituem quaisquer entendimentos
                anteriores sobre o objeto aqui tratado.
              </p>
            </section>

            <section id="plataforma">
              <h2>3. Descrição da Plataforma</h2>
              <p>
                A Immovi é um <strong>marketplace imobiliário digital</strong> que oferece ambiente
                tecnológico para que usuários possam anunciar, buscar, negociar e documentar transações
                imobiliárias de forma direta, segura e transparente.
              </p>
              <p>A Plataforma oferece, entre outros, os seguintes recursos:</p>
              <ul>
                <li>Publicação e busca de anúncios de imóveis residenciais, comerciais e rurais</li>
                <li>Sistema de mensagens diretas entre anunciantes e interessados</li>
                <li>Verificação de titularidade de imóveis por análise de documentos via Inteligência Artificial</li>
                <li>Geração de contratos imobiliários (promessa de compra e venda, locação, permuta e cessão)</li>
                <li>Simulação de financiamento imobiliário</li>
                <li>Sistema de avaliação e reputação de usuários</li>
                <li>Planos de assinatura com funcionalidades diferenciadas</li>
              </ul>
              <p>
                <strong>Importante:</strong> a Immovi atua como <em>intermediária tecnológica</em>,
                não sendo parte nas negociações imobiliárias realizadas entre usuários, não prestando serviços
                de corretagem e não se responsabilizando pelo conteúdo dos anúncios ou pelo resultado das
                negociações. Os contratos gerados pela Plataforma têm caráter de instrumento particular, sendo
                de responsabilidade das partes a verificação de sua adequação jurídica a cada caso concreto.
              </p>
            </section>

            <section id="cadastro">
              <h2>4. Cadastro e Conta de Usuário</h2>
              <h3>4.1. Requisitos para cadastro</h3>
              <ul>
                <li>Ser pessoa física maior de 18 (dezoito) anos e plenamente capaz</li>
                <li>Fornecer informações verdadeiras, precisas, atuais e completas</li>
                <li>Manter as informações cadastrais atualizadas</li>
                <li>Possuir e-mail válido e número de telefone</li>
              </ul>
              <h3>4.2. Perfis de usuário</h3>
              <ul>
                <li><strong>Comprador/Locatário:</strong> acesso gratuito, permite busca e contato com anunciantes</li>
                <li><strong>Vendedor Particular:</strong> exige CPF válido; responsável por declarar ser o legítimo proprietário ou ter poderes para anunciar</li>
                <li><strong>Corretor de Imóveis:</strong> exige CPF válido e número de CRECI ativo; sujeito à verificação junto ao COFECI</li>
              </ul>
              <h3>4.3. Responsabilidades da conta</h3>
              <p>
                O usuário é inteiramente responsável por: (i) manter o sigilo de suas credenciais de acesso;
                (ii) todas as atividades realizadas sob sua conta; (iii) notificar imediatamente a Operadora
                de qualquer uso não autorizado.
              </p>
              <p>
                É vedado criar múltiplas contas, transferir a conta a terceiros ou criar contas em nome de
                outras pessoas sem poderes expressos de representação.
              </p>
            </section>

            <section id="anuncios">
              <h2>5. Publicação de Anúncios</h2>
              <h3>5.1. Responsabilidade do anunciante</h3>
              <p>Ao publicar um anúncio, o Anunciante declara e garante que:</p>
              <ul>
                <li>É o legítimo proprietário do imóvel ou possui poderes legais para anunciá-lo (ex.: procuração)</li>
                <li>Todas as informações do anúncio são verídicas, precisas e não induzem a erro</li>
                <li>O imóvel está disponível para venda ou locação conforme anunciado</li>
                <li>O imóvel não possui impedimentos legais que inviabilizem a transação (penhoras, ações judiciais, restrições etc.) sem que tais circunstâncias sejam expressamente informadas</li>
                <li>Os valores informados são condizentes com a oferta real</li>
                <li>As fotografias e vídeos publicados correspondem ao imóvel anunciado</li>
              </ul>
              <h3>5.2. Conteúdo proibido em anúncios</h3>
              <p>É vedado anunciar:</p>
              <ul>
                <li>Imóveis inexistentes, fictícios ou que não estejam disponíveis para venda/locação</li>
                <li>Imóveis de terceiros sem autorização expressa</li>
                <li>Imóveis com irregularidades omitidas dolosamente</li>
                <li>Serviços ou produtos que não sejam imóveis</li>
              </ul>
              <h3>5.3. Moderação</h3>
              <p>
                A Operadora poderá, a seu exclusivo critério, remover ou suspender anúncios que violem estes
                Termos, contenham informações falsas, ofensivas ou que atentem contra direitos de terceiros,
                sem necessidade de aviso prévio.
              </p>
            </section>

            <section id="negociacoes">
              <h2>6. Negociações entre Usuários</h2>
              <p>
                A Immovi facilita o contato entre Anunciantes e Interessados por meio de sistema de
                mensagens, mas <strong>não intervém, não participa e não se responsabiliza</strong> pelas
                negociações, acordos ou contratos celebrados entre usuários.
              </p>
              <p>Para proteção de todos os usuários, a Plataforma:</p>
              <ul>
                <li>Detecta e bloqueia tentativas de compartilhamento de dados de contato (telefone, WhatsApp) no chat antes do momento adequado</li>
                <li>Monitora conversas para identificar comportamentos fraudulentos ou abusivos</li>
                <li>Mantém histórico das conversas por 2 anos para fins de segurança</li>
              </ul>
              <p>
                Os usuários são responsáveis por verificar a documentação do imóvel, a idoneidade da contraparte
                e as condições da transação antes de formalizar qualquer acordo. Recomendamos fortemente a
                contratação de assessoria jurídica especializada para transações imobiliárias.
              </p>
            </section>

            <section id="pagamentos">
              <h2>7. Planos, Pagamentos e Reembolsos</h2>
              <h3>7.1. Planos disponíveis</h3>
              <p>
                A Plataforma oferece planos gratuitos e pagos, cujos preços, funcionalidades e condições
                estão descritos na página{' '}
                <Link href="/planos" className="text-indigo-600 hover:underline">/planos</Link>.
                A Operadora reserva-se o direito de alterar os preços e funcionalidades dos planos com aviso
                prévio de 30 (trinta) dias.
              </p>
              <h3>7.2. Processamento de pagamentos</h3>
              <p>
                Os pagamentos são processados por prestadores homologados (Stripe Inc. e/ou Asaas Pagamentos S.A.),
                sujeitos aos respectivos termos de serviço. A Immovi não armazena dados de cartão de crédito.
              </p>
              <h3>7.3. Cancelamento e reembolso</h3>
              <ul>
                <li><strong>Planos de assinatura:</strong> podem ser cancelados a qualquer momento, sem multa, encerrando-se ao final do período já pago</li>
                <li><strong>Direito de arrependimento (CDC, art. 49):</strong> compras realizadas fora do estabelecimento físico (online) podem ser canceladas em até 7 (sete) dias corridos da contratação, com reembolso integral</li>
                <li><strong>Foguete (destaque pago):</strong> não reembolsável após ativação, salvo em caso de falha comprovada da Plataforma</li>
                <li><strong>Contratos digitais:</strong> a geração do documento é imediata; não há reembolso após a emissão</li>
              </ul>
            </section>

            <section id="conduta">
              <h2>8. Conduta do Usuário e Usos Proibidos</h2>
              <p>É expressamente vedado ao usuário:</p>
              <ul>
                <li>Fornecer informações falsas, fraudulentas ou enganosas em qualquer campo da Plataforma</li>
                <li>Utilizar a Plataforma para fins de lavagem de dinheiro, estelionato ou qualquer atividade ilícita</li>
                <li>Realizar <em>spam</em>, envio em massa de mensagens não solicitadas ou campanhas de marketing não autorizadas</li>
                <li>Tentar burlar os sistemas de segurança, autenticação ou verificação da Plataforma</li>
                <li>Usar robôs, <em>scrapers</em> ou qualquer automação para extrair dados da Plataforma sem autorização expressa</li>
                <li>Publicar conteúdo ofensivo, discriminatório, pornográfico, que incite à violência ou que viole direitos de terceiros</li>
                <li>Violar direitos de propriedade intelectual de terceiros ou da Operadora</li>
                <li>Criar contas falsas ou utilizar identidades de terceiros</li>
                <li>Interferir no funcionamento técnico da Plataforma ou de seus servidores</li>
                <li>Cobrar comissões ou taxas de outros usuários sem autorização prévia da Operadora</li>
              </ul>
            </section>

            <section id="verificacao">
              <h2>9. Verificação de Documentos por Inteligência Artificial</h2>
              <p>
                A Plataforma oferece o serviço de verificação de titularidade de imóveis por meio de análise
                de documentos por Inteligência Artificial (IA). Ao utilizar este serviço, o usuário:
              </p>
              <ul>
                <li>Autoriza o envio do documento ao provedor de IA selecionado (Google Gemini ou Anthropic Claude) para processamento</li>
                <li>Declara que possui autorização para submeter o documento ao processamento automatizado</li>
                <li>Reconhece que o resultado da análise é uma <strong>avaliação automatizada de caráter informativo</strong>, sujeita a erros, e não constitui certidão jurídica, laudo pericial ou qualquer documento com efeito legal</li>
                <li>Compreende que o badge "Verificado" na Plataforma indica apenas que a IA identificou correspondência entre o nome do anunciante e o documento, não garantindo a regularidade jurídica do imóvel</li>
              </ul>
              <p>
                A Operadora não se responsabiliza por erros, imprecisões ou omissões na análise automatizada.
                Recomendamos sempre a consulta a um profissional jurídico qualificado para verificação da
                regularidade documental de imóveis.
              </p>
            </section>

            <section id="propriedade">
              <h2>10. Propriedade Intelectual</h2>
              <p>
                Todos os elementos da Plataforma — incluindo, sem limitação, marca, logotipo, código-fonte,
                design, interfaces, textos, algoritmos e conteúdo editorial — são de propriedade exclusiva
                da Immovi ou de seus licenciantes, protegidos pela Lei nº 9.279/1996 (Lei de Propriedade
                Industrial), Lei nº 9.610/1998 (Lei de Direitos Autorais) e demais normas aplicáveis.
              </p>
              <p>
                O usuário recebe uma licença limitada, não exclusiva, intransferível e revogável para acessar
                e utilizar a Plataforma exclusivamente para os fins previstos nestes Termos. É vedada qualquer
                reprodução, modificação, distribuição ou exploração comercial sem autorização prévia e por escrito.
              </p>
              <p>
                Ao publicar conteúdo na Plataforma (fotografias, textos, vídeos), o usuário concede à Operadora
                licença não exclusiva, gratuita, mundial e por prazo indeterminado para usar, reproduzir e
                exibir tal conteúdo para fins de operação e divulgação da Plataforma, mantendo o usuário a
                titularidade dos direitos autorais.
              </p>
            </section>

            <section id="responsabilidade">
              <h2>11. Limitação de Responsabilidade</h2>
              <h3>11.1. Isenções</h3>
              <p>Na máxima extensão permitida pela legislação aplicável, a Immovi não se responsabiliza por:</p>
              <ul>
                <li>Conteúdo publicado por usuários, incluindo informações falsas, imprecisas ou enganosas em anúncios</li>
                <li>Negociações realizadas entre usuários fora da Plataforma ou qualquer transação imobiliária celebrada</li>
                <li>Vícios ocultos, regularidade documental ou situação jurídica dos imóveis anunciados</li>
                <li>Perdas ou danos decorrentes de fraudes praticadas por outros usuários</li>
                <li>Interrupções, falhas técnicas ou indisponibilidade temporária da Plataforma</li>
                <li>Decisões tomadas com base nos resultados da verificação por IA</li>
                <li>Atos de força maior, caso fortuito ou eventos fora do controle razoável da Operadora</li>
              </ul>
              <h3>11.2. Limitação de valor</h3>
              <p>
                Em hipótese alguma a responsabilidade total da Immovi perante um usuário excederá
                o montante efetivamente pago pelo usuário à Operadora nos 12 (doze) meses anteriores ao evento
                que deu origem ao dano.
              </p>
              <h3>11.3. Ressalva do CDC</h3>
              <p>
                Nada nestes Termos afasta a aplicação do Código de Defesa do Consumidor (Lei nº 8.078/1990)
                nas relações de consumo, nem exclui ou limita direitos que não possam ser afastados por lei.
              </p>
            </section>

            <section id="suspensao">
              <h2>12. Suspensão e Encerramento de Conta</h2>
              <h3>12.1. Pela Operadora</h3>
              <p>
                A Operadora poderá, a qualquer momento, suspender ou encerrar a conta de usuário que:
                (i) viole estes Termos; (ii) forneça informações falsas; (iii) pratique atos fraudulentos;
                (iv) utilize a Plataforma para fins ilícitos; ou (v) cuja conta esteja inativa por mais de
                2 (dois) anos, após notificação por e-mail com 30 (trinta) dias de antecedência.
              </p>
              <p>
                Em casos de violações graves, a suspensão pode ser imediata, sem notificação prévia, incluindo
                cancelamento de planos sem reembolso proporcional.
              </p>
              <h3>12.2. Pelo usuário</h3>
              <p>
                O usuário pode encerrar sua conta a qualquer momento pelas configurações da Plataforma ou
                solicitando ao suporte. O encerramento não afeta direitos e obrigações anteriormente constituídos.
                Os dados serão tratados conforme a Política de Privacidade.
              </p>
            </section>

            <section id="resolucao">
              <h2>13. Resolução de Disputas</h2>
              <h3>13.1. Canal de atendimento</h3>
              <p>
                Em caso de insatisfação ou reclamação, o usuário deve, primeiramente, entrar em contato com
                o suporte da Immovi pelo e-mail <strong>suporte@immovi.com.br</strong>,
                descrevendo detalhadamente o problema. Nos comprometemos a responder em até 5 (cinco) dias úteis.
              </p>
              <h3>13.2. Plataformas de defesa do consumidor</h3>
              <p>
                Caso a questão não seja resolvida diretamente, o usuário pode recorrer ao{' '}
                <strong>Procon</strong> de seu estado, ao portal{' '}
                <a href="https://consumidor.gov.br" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  consumidor.gov.br
                </a>{' '}
                (plataforma oficial do Governo Federal) ou ao Juizado Especial Cível competente.
              </p>
              <h3>13.3. Arbitragem</h3>
              <p>
                Para disputas de valor superior a R$ 60.000,00 (sessenta mil reais), as partes concordam em
                tentar, previamente ao ajuizamento de ação judicial, resolver a controvérsia por meio de
                mediação ou arbitragem, nos termos da Lei nº 9.307/1996, perante câmara arbitral de escolha
                mútua, com sede na comarca de Ivolândia-GO ou em câmara eletrônica reconhecida pelas partes.
              </p>
            </section>

            <section id="lei-aplicavel">
              <h2>14. Lei Aplicável e Foro</h2>
              <p>
                Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa
                do Brasil, notadamente o Código Civil (Lei nº 10.406/2002), o Código de Defesa do Consumidor
                (Lei nº 8.078/1990), o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção
                de Dados Pessoais (Lei nº 13.709/2018).
              </p>
              <p>
                Para dirimir quaisquer controvérsias decorrentes destes Termos, as partes elegem o Foro da
                Comarca de <strong>Ivolândia, Estado de Goiás</strong>, renunciando a qualquer outro, por
                mais privilegiado que seja, salvo nas hipóteses em que a lei determine foro diverso (ex.:
                domicílio do consumidor, nos termos do art. 101, I, do CDC).
              </p>
            </section>

            <section id="disposicoes">
              <h2>15. Disposições Gerais</h2>
              <ul>
                <li>
                  <strong>Integralidade:</strong> estes Termos, juntamente com a Política de Privacidade e
                  demais políticas publicadas na Plataforma, constituem o acordo integral entre as partes.
                </li>
                <li>
                  <strong>Divisibilidade:</strong> caso qualquer cláusula seja declarada inválida ou inexequível,
                  as demais permanecerão em pleno vigor.
                </li>
                <li>
                  <strong>Tolerância:</strong> a tolerância da Operadora em relação a qualquer descumprimento
                  não constitui renúncia ao direito de exigir o cumprimento futuro ou reparação por danos.
                </li>
                <li>
                  <strong>Cessão:</strong> o usuário não pode ceder os direitos e obrigações decorrentes destes
                  Termos sem consentimento prévio por escrito da Operadora. A Operadora pode cedê-los a qualquer
                  entidade do mesmo grupo econômico ou a terceiros em caso de fusão, aquisição ou reestruturação.
                </li>
                <li>
                  <strong>Comunicações:</strong> todas as comunicações oficiais serão realizadas pelo e-mail
                  cadastrado pelo usuário, sendo de sua responsabilidade manter os dados atualizados.
                </li>
                <li>
                  <strong>Idioma:</strong> estes Termos são redigidos em língua portuguesa. Em caso de
                  divergência com versões em outros idiomas, prevalece a versão em português.
                </li>
              </ul>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8 text-sm text-gray-500">
              <p>
                <strong>Immovi</strong> — Ivolândia, GO, Brasil<br/>
                Última atualização: {ULTIMA_ATUALIZACAO}<br/>
                Estes Termos foram elaborados em conformidade com a legislação brasileira vigente.
              </p>
              <p className="mt-3">
                <Link href="/privacidade" className="text-indigo-600 hover:underline">← Ver Política de Privacidade</Link>
              </p>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
