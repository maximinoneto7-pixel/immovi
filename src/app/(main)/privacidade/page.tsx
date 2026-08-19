import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { auth } from '@/lib/auth'
import { Shield, ChevronRight } from 'lucide-react'

const ULTIMA_ATUALIZACAO = '25 de junho de 2026'

const sections = [
  { id: 'introducao', title: '1. Introdução e Identificação do Controlador' },
  { id: 'dados-coletados', title: '2. Dados Pessoais Coletados' },
  { id: 'finalidades', title: '3. Finalidades do Tratamento' },
  { id: 'base-legal', title: '4. Base Legal para o Tratamento' },
  { id: 'compartilhamento', title: '5. Compartilhamento de Dados' },
  { id: 'retencao', title: '6. Retenção e Exclusão dos Dados' },
  { id: 'direitos', title: '7. Direitos do Titular' },
  { id: 'cookies', title: '8. Cookies e Tecnologias de Rastreamento' },
  { id: 'seguranca', title: '9. Segurança dos Dados' },
  { id: 'menores', title: '10. Tratamento de Dados de Menores' },
  { id: 'transferencia', title: '11. Transferência Internacional de Dados' },
  { id: 'alteracoes', title: '12. Alterações desta Política' },
  { id: 'contato', title: '13. Canal de Atendimento ao Titular (DPO)' },
]

export default async function PrivacidadePage() {
  const session = await auth()

  return (
    <>
      <Header user={session?.user as any} />
      <main className="flex-1 bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-8 h-8 text-indigo-300" />
              <h1 className="text-3xl font-bold">Política de Privacidade</h1>
            </div>
            <p className="text-indigo-100 text-lg">
              Última atualização: <strong className="text-white">{ULTIMA_ATUALIZACAO}</strong>
            </p>
            <p className="text-indigo-100 mt-2 text-sm">
              Em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)
              e demais legislações aplicáveis.
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
            <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-indigo-500 pl-4 bg-indigo-50 rounded-r-xl py-3 pr-3 not-prose">
              Esta Política de Privacidade descreve como a plataforma <strong>Immovi</strong> coleta, usa, armazena,
              compartilha e protege os dados pessoais dos seus usuários. Ao utilizar nossa plataforma, você declara ter lido
              e concordado com os termos aqui estabelecidos.
            </p>

            <section id="introducao">
              <h2>1. Introdução e Identificação do Controlador</h2>
              <p>
                A plataforma <strong>Immovi</strong> é operada por <strong>MNM Tecnologia LTDA</strong>,
                inscrita no CNPJ sob o nº <strong>67.880.630/0001-79</strong>, com sede na cidade de
                <strong> Ivolândia, Estado de Goiás, Brasil</strong>, Controladora dos dados pessoais tratados por
                meio desta plataforma, nos termos do art. 5º, inciso VI, da Lei nº 13.709/2018 (LGPD).
              </p>
              <p>
                A plataforma Immovi é um marketplace digital voltado à intermediação de negócios imobiliários,
                conectando vendedores, compradores, locadores e locatários de imóveis residenciais, comerciais e rurais
                em todo o território nacional.
              </p>
              <p>
                Para fins desta Política, os termos <em>dados pessoais</em>, <em>tratamento</em>, <em>titular</em>,
                <em>controlador</em>, <em>operador</em> e <em>encarregado</em> têm os significados atribuídos pelo
                art. 5º da LGPD.
              </p>
            </section>

            <section id="dados-coletados">
              <h2>2. Dados Pessoais Coletados</h2>
              <p>Coletamos os seguintes dados pessoais, conforme a natureza da interação com a plataforma:</p>

              <h3>2.1. Dados fornecidos diretamente pelo titular</h3>
              <ul>
                <li><strong>Dados de identificação:</strong> nome completo, CPF, RG, data de nascimento</li>
                <li><strong>Dados de contato:</strong> endereço de e-mail, número de telefone/WhatsApp</li>
                <li><strong>Dados profissionais:</strong> número de CRECI, nome da imobiliária (para corretores)</li>
                <li><strong>Dados de imóvel:</strong> endereço, descrição, valor, fotografias e documentos do imóvel</li>
                <li><strong>Dados financeiros:</strong> informações de pagamento processadas via Stripe ou Asaas (não armazenamos dados de cartão de crédito)</li>
                <li><strong>Comunicações:</strong> mensagens trocadas pelo chat da plataforma</li>
                <li><strong>Documentos:</strong> matrículas, escrituras, certidões enviadas para verificação</li>
              </ul>

              <h3>2.2. Dados coletados automaticamente</h3>
              <ul>
                <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, sistema operacional, páginas visitadas, tempo de permanência</li>
                <li><strong>Dados de dispositivo:</strong> identificadores de dispositivo, resolução de tela</li>
                <li><strong>Dados de geolocalização:</strong> localização aproximada inferida do IP (não coletamos GPS)</li>
                <li><strong>Cookies e tecnologias similares:</strong> conforme descrito na Seção 8</li>
              </ul>

              <h3>2.3. Dados recebidos de terceiros</h3>
              <ul>
                <li><strong>Autenticação social:</strong> quando você faz login via Google ou Apple, recebemos nome, e-mail e foto de perfil autorizados por você</li>
                <li><strong>Processadores de pagamento:</strong> confirmações de transação e identificadores de cliente</li>
                <li><strong>Inteligência Artificial:</strong> dados extraídos de documentos imobiliários por nossa IA (Google Gemini ou Anthropic Claude) para fins de verificação de propriedade</li>
              </ul>
            </section>

            <section id="finalidades">
              <h2>3. Finalidades do Tratamento</h2>
              <p>Tratamos seus dados pessoais para as seguintes finalidades:</p>
              <table className="w-full text-sm border-collapse not-prose">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="border border-gray-200 p-3 font-semibold">Finalidade</th>
                    <th className="border border-gray-200 p-3 font-semibold">Exemplos</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Prestação do serviço', 'Criar e gerenciar sua conta, publicar anúncios, habilitar o chat entre usuários'],
                    ['Verificação de identidade', 'Validar CPF, verificar titularidade de imóveis via análise de documentos por IA'],
                    ['Processamento de pagamentos', 'Cobrar assinaturas de planos, processar pagamentos de anúncios em destaque'],
                    ['Segurança e prevenção de fraudes', 'Detectar comportamentos suspeitos, bloquear compartilhamento indevido de dados de contato'],
                    ['Comunicações transacionais', 'Enviar confirmações, notificações de mensagens recebidas, alertas de imóveis'],
                    ['Melhoria do serviço', 'Analisar padrões de uso para aprimorar funcionalidades e experiência do usuário'],
                    ['Cumprimento de obrigações legais', 'Atender requisições de autoridades competentes, obrigações fiscais e tributárias'],
                    ['Exercício regular de direitos', 'Defender interesses em processos judiciais, administrativos ou arbitrais'],
                  ].map(([f, e], i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="border border-gray-200 p-3 font-medium text-gray-800">{f}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section id="base-legal">
              <h2>4. Base Legal para o Tratamento</h2>
              <p>Nos termos do art. 7º da LGPD, todo tratamento de dados pessoais realizado pela Immovi possui uma das seguintes bases legais:</p>
              <ul>
                <li><strong>Consentimento (art. 7º, I):</strong> para envio de comunicações de marketing e utilização de cookies analíticos não essenciais</li>
                <li><strong>Execução de contrato (art. 7º, V):</strong> para prestação dos serviços da plataforma, quando há relação contratual estabelecida</li>
                <li><strong>Cumprimento de obrigação legal (art. 7º, II):</strong> para guarda de dados conforme obrigações fiscais e regulatórias</li>
                <li><strong>Legítimo interesse (art. 7º, IX):</strong> para segurança, prevenção a fraudes e melhoria da plataforma, desde que não prevaleçam sobre os direitos do titular</li>
                <li><strong>Exercício regular de direitos (art. 7º, VI):</strong> para defesa em processos judiciais, administrativos ou arbitrais</li>
                <li><strong>Proteção ao crédito (art. 7º, X):</strong> para fins de verificação e segurança transacional</li>
              </ul>
            </section>

            <section id="compartilhamento">
              <h2>5. Compartilhamento de Dados</h2>
              <p>
                Não vendemos dados pessoais a terceiros. Podemos compartilhar seus dados exclusivamente nas
                situações a seguir, mediante medidas contratuais e técnicas de proteção adequadas:
              </p>
              <ul>
                <li><strong>Outros usuários da plataforma:</strong> nome e dados de contato são compartilhados na medida necessária para viabilizar a negociação imobiliária (ex.: ao iniciar uma conversa com um anunciante)</li>
                <li><strong>Processadores de pagamento:</strong> Stripe Inc. e Asaas Pagamentos S.A., para processamento de transações financeiras</li>
                <li><strong>Provedores de IA:</strong> Google LLC (Gemini) e Anthropic PBC (Claude), para análise de documentos imobiliários, limitada ao conteúdo do documento submetido</li>
                <li><strong>Provedores de autenticação:</strong> Google LLC e Apple Inc., quando você utiliza login social</li>
                <li><strong>Prestadores de serviços técnicos:</strong> hospedagem, e-mail transacional, monitoramento — sempre vinculados por acordos de confidencialidade e processamento de dados</li>
                <li><strong>Autoridades públicas:</strong> quando exigido por lei, decisão judicial ou investigação regulatória</li>
                <li><strong>Sucessores empresariais:</strong> em caso de fusão, aquisição ou reestruturação societária, com manutenção das obrigações desta Política</li>
              </ul>
            </section>

            <section id="retencao">
              <h2>6. Retenção e Exclusão dos Dados</h2>
              <p>Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta Política ou para atender obrigações legais, nos seguintes prazos orientativos:</p>
              <ul>
                <li><strong>Dados de conta ativa:</strong> enquanto a conta permanecer ativa na plataforma</li>
                <li><strong>Dados de conta encerrada:</strong> até 5 (cinco) anos após o encerramento, para cumprimento de obrigações legais e exercício de direitos (Código Civil, art. 206, §5º)</li>
                <li><strong>Dados de transações financeiras:</strong> 10 (dez) anos, conforme exigências fiscais (Lei nº 9.430/96)</li>
                <li><strong>Comunicações de chat:</strong> até 2 (dois) anos após o encerramento da conversa, para fins de segurança</li>
                <li><strong>Documentos imobiliários:</strong> dados extraídos são armazenados vinculados ao anúncio; o documento original não é retido permanentemente</li>
                <li><strong>Logs de acesso:</strong> 6 (seis) meses, conforme o Marco Civil da Internet (Lei nº 12.965/2014)</li>
              </ul>
              <p>Após o vencimento dos prazos acima, os dados são anonimizados ou excluídos de forma segura e irreversível.</p>
            </section>

            <section id="direitos">
              <h2>7. Direitos do Titular</h2>
              <p>
                Nos termos do art. 18 da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais,
                que podem ser exercidos a qualquer momento pelo canal indicado na Seção 13:
              </p>
              <ul>
                <li><strong>Confirmação e acesso (art. 18, I e II):</strong> confirmar a existência de tratamento e obter acesso aos seus dados</li>
                <li><strong>Correção (art. 18, III):</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, bloqueio ou eliminação (art. 18, IV):</strong> de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD</li>
                <li><strong>Portabilidade (art. 18, V):</strong> receber seus dados em formato estruturado e interoperável</li>
                <li><strong>Eliminação (art. 18, VI):</strong> dos dados tratados com base no seu consentimento, ressalvadas as hipóteses de guarda obrigatória</li>
                <li><strong>Informação sobre compartilhamento (art. 18, VII):</strong> saber com quais entidades seus dados foram compartilhados</li>
                <li><strong>Revogação do consentimento (art. 18, IX):</strong> retirar o consentimento a qualquer momento, sem prejuízo da licitude do tratamento anterior</li>
                <li><strong>Oposição (art. 18, §2º):</strong> opor-se a tratamento baseado em legítimo interesse, quando não justificado</li>
                <li><strong>Revisão de decisões automatizadas (art. 20):</strong> solicitar revisão humana de decisões tomadas exclusivamente por sistemas automatizados</li>
              </ul>
              <p>
                Atenderemos sua solicitação no prazo máximo de <strong>15 (quinze) dias</strong>, podendo ser prorrogado
                por mais 15 dias em casos complexos, com informação prévia ao titular.
              </p>
            </section>

            <section id="cookies">
              <h2>8. Cookies e Tecnologias de Rastreamento</h2>
              <p>Utilizamos as seguintes categorias de cookies:</p>
              <ul>
                <li><strong>Essenciais (sempre ativos):</strong> necessários para o funcionamento básico da plataforma (sessão de login, segurança, preferências). Não podem ser desativados.</li>
                <li><strong>Funcionais (opt-in):</strong> lembram suas preferências de busca, localização e configurações para melhorar a experiência</li>
                <li><strong>Analíticos (opt-in):</strong> coletam dados agregados e anônimos sobre o uso da plataforma para fins de melhoria</li>
                <li><strong>Terceiros:</strong> Google OAuth e Apple Sign In utilizam cookies próprios sujeitos às respectivas políticas de privacidade</li>
              </ul>
              <p>
                Você pode gerenciar os cookies por meio das configurações do seu navegador. A desativação de cookies
                essenciais pode impedir o funcionamento de partes da plataforma.
              </p>
            </section>

            <section id="seguranca">
              <h2>9. Segurança dos Dados</h2>
              <p>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais, incluindo:</p>
              <ul>
                <li>Criptografia em trânsito (TLS/HTTPS) e em repouso</li>
                <li>Autenticação robusta e controle de acesso por função (RBAC)</li>
                <li>Backups periódicos com armazenamento seguro</li>
                <li>Monitoramento de acessos e detecção de anomalias</li>
                <li>Segregação de ambientes de produção e desenvolvimento</li>
                <li>Treinamento periódico da equipe em boas práticas de segurança</li>
                <li>Avaliação de impacto à proteção de dados (DPIA) para tratamentos de alto risco</li>
              </ul>
              <p>
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares,
                notificaremos a <strong>ANPD</strong> e os titulares afetados no prazo previsto no art. 48 da LGPD
                (em geral, em até 2 dias úteis após a ciência do incidente).
              </p>
            </section>

            <section id="menores">
              <h2>10. Tratamento de Dados de Menores</h2>
              <p>
                A plataforma Immovi é destinada exclusivamente a <strong>maiores de 18 (dezoito) anos</strong>.
                Não coletamos intencionalmente dados de crianças ou adolescentes. Caso identifiquemos que dados de
                menores foram fornecidos sem autorização, procederemos à eliminação imediata. Pais ou responsáveis
                que identifiquem tal situação devem nos contatar pelo canal indicado na Seção 13.
              </p>
            </section>

            <section id="transferencia">
              <h2>11. Transferência Internacional de Dados</h2>
              <p>
                Alguns dos nossos prestadores de serviços estão localizados fora do Brasil, o que implica
                transferência internacional de dados nos termos do art. 33 da LGPD:
              </p>
              <ul>
                <li><strong>Google LLC (EUA):</strong> serviços de OAuth e processamento de IA (Gemini) — coberto pelo EU-US Data Privacy Framework e Cláusulas Contratuais Padrão</li>
                <li><strong>Anthropic PBC (EUA):</strong> processamento de IA (Claude) para análise de documentos — sujeito a contrato de processamento de dados</li>
                <li><strong>Stripe Inc. (EUA):</strong> processamento de pagamentos — certificado PCI DSS Nível 1</li>
              </ul>
              <p>
                Todas as transferências ocorrem apenas para países com nível adequado de proteção ou mediante
                a adoção de garantias contratuais adequadas, em conformidade com o art. 33 da LGPD.
              </p>
            </section>

            <section id="alteracoes">
              <h2>12. Alterações desta Política</h2>
              <p>
                Podemos atualizar esta Política periodicamente para refletir mudanças em nossas práticas, na legislação
                ou nos serviços oferecidos. Alterações materiais serão comunicadas por e-mail e/ou por aviso em destaque
                na plataforma com antecedência mínima de <strong>15 (quinze) dias</strong> antes de sua vigência.
              </p>
              <p>
                A versão atual sempre estará disponível nesta página. A continuação do uso da plataforma após a
                entrada em vigor das alterações implica aceite das novas condições.
              </p>
            </section>

            <section id="contato">
              <h2>13. Canal de Atendimento ao Titular (DPO)</h2>
              <p>
                Nos termos do art. 41 da LGPD, designamos um Encarregado pelo Tratamento de Dados Pessoais
                (<em>Data Protection Officer</em> — DPO), responsável por atuar como canal de comunicação entre
                a Immovi, os titulares de dados e a Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
              <p>Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato:</p>
              <ul>
                <li><strong>E-mail:</strong> privacidade@immovi.com.br</li>
                <li><strong>Assunto do e-mail:</strong> "LGPD — [Direito que deseja exercer]"</li>
                <li><strong>Endereço:</strong> Ivolândia — GO, Brasil</li>
                <li><strong>Prazo de resposta:</strong> até 15 dias úteis</li>
              </ul>
              <p>
                Caso entenda que sua solicitação não foi atendida de forma satisfatória, você pode recorrer à
                <strong> Autoridade Nacional de Proteção de Dados (ANPD)</strong> em{' '}
                <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  www.gov.br/anpd
                </a>.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8 text-sm text-gray-500">
              <p>
                <strong>Immovi</strong> — Ivolândia, GO, Brasil<br/>
                Última atualização: {ULTIMA_ATUALIZACAO}<br/>
                Esta política foi elaborada em conformidade com a Lei nº 13.709/2018 (LGPD)
                e o Marco Civil da Internet (Lei nº 12.965/2014).
              </p>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
