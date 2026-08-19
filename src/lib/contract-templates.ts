// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Parte {
  nome: string
  cpf: string
  rg?: string
  nacionalidade?: string
  estadoCivil?: string
  naturalidade?: string
  profissao?: string
  endereco?: string
}

export interface ContractData {
  type: string
  title?: string
  city: string
  date?: string

  // Partes (arrays para suportar múltiplas)
  parteA: Parte[]   // Vendedor / Locador / Permutante A / Cedente
  parteB: Parte[]   // Comprador / Locatário / Permutante B / Cessionário

  // Imóvel
  propertyAddress: string
  propertyCity: string
  propertyState: string
  propertyDescription: string
  propertyRegistration?: string

  // Valores — compra e venda
  totalPrice?: string
  signalAmount?: string
  remainingAmount?: string
  paymentConditions?: string
  completionDate?: string
  paymentMethod?: string           // forma de pagamento do sinal
  remainingPaymentMethod?: string  // forma de pagamento do saldo

  // Locação
  rentValue?: string
  rentDuration?: string
  rentGuarantee?: string
  rentStartDate?: string
  condoFee?: string
  condoFeeBy?: string
  iptu?: string
  iptuBy?: string
  rentPaymentMethod?: string       // forma de pagamento do aluguel

  // Permuta
  propertyADescription?: string
  propertyBDescription?: string
  complementaryValue?: string
  complementaryPaymentMethod?: string // forma de pagamento da torna

  // Cessão
  cessaoObject?: string
  cessaoPaymentMethod?: string     // forma de pagamento da cessão

  // Testemunhas
  witnessName1?: string
  witnessCpf1?: string
  witnessName2?: string
  witnessCpf2?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CIVIL: Record<string, string> = {
  solteiro: 'solteiro(a)',
  casado: 'casado(a)',
  divorciado: 'divorciado(a)',
  viuvo: 'viúvo(a)',
  uniao_estavel: 'em união estável',
  separado: 'separado(a) judicialmente',
}

function qualificacao(p: Parte, titulo: string): string {
  const partes = [
    `<strong>${p.nome}</strong>`,
    p.nacionalidade ? `${p.nacionalidade}` : 'brasileiro(a)',
    p.estadoCivil ? ESTADO_CIVIL[p.estadoCivil] || p.estadoCivil : '',
    p.naturalidade ? `natural de ${p.naturalidade}` : '',
    p.profissao || '',
    `portador(a) do RG nº <strong>${p.rg || '_______________'}</strong>`,
    `inscrito(a) no CPF sob o nº <strong>${p.cpf}</strong>`,
    `residente e domiciliado(a) em ${p.endereco || '___________________________'}`,
    `maior e capaz`,
  ].filter(Boolean).join(', ')
  return `<strong>${titulo.toUpperCase()}:</strong> ${partes}, doravante denominado(a) simplesmente <strong>${titulo}</strong>.`
}

function qualificacaoMultipla(partes: Parte[], titulo: string, tituloPlural: string): string {
  if (!partes.length) return ''
  if (partes.length === 1) return qualificacao(partes[0], titulo)

  const linhas = partes.map((p, i) =>
    `<strong>${titulo.toUpperCase()} ${i + 1}:</strong> ${[
      `<strong>${p.nome}</strong>`,
      p.nacionalidade || 'brasileiro(a)',
      p.estadoCivil ? ESTADO_CIVIL[p.estadoCivil] || p.estadoCivil : '',
      p.naturalidade ? `natural de ${p.naturalidade}` : '',
      p.profissao || '',
      `portador(a) do RG nº <strong>${p.rg || '_______________'}</strong>`,
      `CPF nº <strong>${p.cpf}</strong>`,
      `residente em ${p.endereco || '___________________________'}`,
      `maior e capaz`,
    ].filter(Boolean).join(', ')}`
  ).join('<br/><br/>')

  return `${linhas}<br/><br/>Em conjunto denominados <strong>${tituloPlural.toUpperCase()}</strong>.`
}

function encargosLocacao(data: ContractData): string {
  const linhas: string[] = []
  if (data.condoFee) {
    const resp = data.condoFeeBy === 'LOCADOR' ? 'LOCADOR' : data.condoFeeBy === 'INCLUSO' ? 'incluso no aluguel' : 'LOCATÁRIO'
    linhas.push(`Taxa de condomínio: R$ ${data.condoFee}/mês — por conta do ${resp}`)
  }
  if (data.iptu) {
    const resp = data.iptuBy === 'LOCADOR' ? 'LOCADOR' : data.iptuBy === 'INCLUSO' ? 'incluso no aluguel' : 'LOCATÁRIO'
    linhas.push(`IPTU: R$ ${data.iptu}/mês — por conta do ${resp}`)
  }
  return linhas.length ? `<ul style="margin:8px 0 0 20px;">${linhas.map(l => `<li>${l}</li>`).join('')}</ul>` : 'Não informado.'
}

const assinaturas = (data: ContractData, tituloA: string, tituloB: string) => `
  <p style="text-align:center;margin-top:60px;margin-bottom:50px;">${data.city}, ${data.date || '___ de ___________ de ______'}</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:20px;">
    ${data.parteA.map((p, i) => `
    <div style="text-align:center;border-top:1px solid #1a1a1a;padding-top:8px;">
      <strong>${p.nome}</strong><br/>
      <small>${tituloA}${data.parteA.length > 1 ? ` ${i + 1}` : ''} — CPF: ${p.cpf}</small>
    </div>`).join('')}
    ${data.parteB.map((p, i) => `
    <div style="text-align:center;border-top:1px solid #1a1a1a;padding-top:8px;">
      <strong>${p.nome}</strong><br/>
      <small>${tituloB}${data.parteB.length > 1 ? ` ${i + 1}` : ''} — CPF: ${p.cpf}</small>
    </div>`).join('')}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:50px;">
    <div style="text-align:center;border-top:1px solid #1a1a1a;padding-top:8px;">
      <strong>${data.witnessName1 || '________________________________'}</strong><br/>
      <small>Testemunha 1${data.witnessCpf1 ? ` — CPF: ${data.witnessCpf1}` : ''}</small>
    </div>
    <div style="text-align:center;border-top:1px solid #1a1a1a;padding-top:8px;">
      <strong>${data.witnessName2 || '________________________________'}</strong><br/>
      <small>Testemunha 2${data.witnessCpf2 ? ` — CPF: ${data.witnessCpf2}` : ''}</small>
    </div>
  </div>

  <p style="text-align:center;margin-top:40px;font-size:9pt;color:#666;border-top:1px solid #eee;padding-top:16px;">
    Contrato gerado pela plataforma <strong>Immovi</strong><br/>
    Este documento tem valor de instrumento particular. Para maior segurança, reconheça as firmas em cartório.
  </p>
`

const estiloBase = `font-family:Times New Roman,serif;font-size:12pt;line-height:1.8;max-width:780px;margin:0 auto;padding:40px;color:#1a1a1a;`
const h1Style = `font-size:15pt;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0;`
const h2Style = `font-size:13pt;font-weight:bold;text-transform:uppercase;margin-top:28px;border-bottom:1px solid #666;padding-bottom:6px;`
const pStyle = `text-align:justify;margin-bottom:16px;`

// ─── TEMPLATE 1: Promessa de Compra e Venda ───────────────────────────────────

export function generatePromessaCompraVenda(d: ContractData): string {
  return `<div style="${estiloBase}">
  <div style="text-align:center;margin-bottom:36px;border-bottom:2px solid #1a1a1a;padding-bottom:18px;">
    <h1 style="${h1Style}">Instrumento Particular de Promessa de Compra e Venda de Imóvel</h1>
  </div>

  <p style="${pStyle}">Pelo presente instrumento particular, as partes abaixo qualificadas celebram entre si o presente <strong>INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL</strong>, que se regerá pelas cláusulas e condições seguintes:</p>

  <h2 style="${h2Style}">Das Partes</h2>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteA, 'Vendedor', 'Vendedores')}</p>
  <br/>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteB, 'Comprador', 'Compradores')}</p>

  <h2 style="${h2Style}">Cláusula Primeira — Do Objeto</h2>
  <p style="${pStyle}">O presente contrato tem por objeto a promessa de compra e venda do imóvel a seguir descrito:</p>
  <p style="margin-left:20px;font-style:italic;">${d.propertyDescription}, situado à <strong>${d.propertyAddress}</strong>, na cidade de <strong>${d.propertyCity}/${d.propertyState}</strong>${d.propertyRegistration ? `, matriculado sob o nº <strong>${d.propertyRegistration}</strong> no Cartório de Registro de Imóveis competente` : ''}.</p>

  <h2 style="${h2Style}">Cláusula Segunda — Do Preço e Forma de Pagamento</h2>
  <p style="${pStyle}">O imóvel é prometido à venda pelo preço total de <strong>R$ ${d.totalPrice || '_______________'}</strong>, a ser pago da seguinte forma:</p>
  ${d.signalAmount ? `
  <p style="margin-left:20px;"><strong>a) Sinal e princípio de pagamento:</strong> o valor de <strong>R$ ${d.signalAmount}</strong>, pago neste ato mediante <strong>${d.paymentMethod || '_______________'}</strong>, do qual o(s) VENDEDOR(ES) dão plena e geral quitação;</p>
  <p style="margin-left:20px;"><strong>b) Saldo:</strong> o valor de <strong>R$ ${d.remainingAmount || '_______________'}</strong>, a ser pago mediante <strong>${d.remainingPaymentMethod || '_______________'}</strong>${d.paymentConditions ? `, nos seguintes termos: ${d.paymentConditions}` : ', na data de assinatura da escritura definitiva'}.</p>
  ` : `<p style="margin-left:20px;">Valor único de <strong>R$ ${d.totalPrice || '_______________'}</strong>, pago mediante <strong>${d.paymentMethod || '_______________'}</strong>${d.paymentConditions ? `. ${d.paymentConditions}` : ''}.</p>`}

  <h2 style="${h2Style}">Cláusula Terceira — Da Tradição e Escritura Definitiva</h2>
  <p style="${pStyle}">O(s) VENDEDOR(ES) obriga(m)-se a outorgar ao(s) COMPRADOR(ES) a escritura pública definitiva de compra e venda, livre e desembaraçada de quaisquer ônus, dívidas ou gravames, até a data de <strong>${d.completionDate || '___/___/______'}</strong>, após o integral pagamento do preço, correndo por conta do(s) COMPRADOR(ES) as despesas de escritura e registro.</p>

  <h2 style="${h2Style}">Cláusula Quarta — Das Obrigações do(s) Vendedor(es)</h2>
  <p style="${pStyle}">O(s) VENDEDOR(ES) obriga(m)-se a:</p>
  <ol style="margin-left:20px;${pStyle}">
    <li>Entregar o imóvel em perfeitas condições de uso e habitabilidade;</li>
    <li>Manter o imóvel livre de quaisquer ônus, dívidas e gravames;</li>
    <li>Apresentar toda a documentação necessária para a formalização da escritura;</li>
    <li>Pagar todos os débitos relativos ao imóvel (IPTU, condomínio, água, luz etc.) até a data da entrega das chaves;</li>
    <li>Não alienar ou onerar o imóvel a terceiros enquanto vigorar este contrato.</li>
  </ol>

  <h2 style="${h2Style}">Cláusula Quinta — Das Obrigações do(s) Comprador(es)</h2>
  <ol style="margin-left:20px;${pStyle}">
    <li>Efetuar os pagamentos nas datas e condições acordadas;</li>
    <li>Não ceder ou transferir este contrato sem prévia anuência do(s) VENDEDOR(ES);</li>
    <li>Pagar o ITBI e demais encargos tributários relativos à aquisição;</li>
    <li>Arcar com as despesas cartorárias de escritura e registro.</li>
  </ol>

  <h2 style="${h2Style}">Cláusula Sexta — Da Multa e Rescisão Contratual</h2>
  <p style="${pStyle}">Em caso de inadimplemento: <strong>multa moratória de 2%</strong> sobre o valor em atraso, <strong>juros de 1% ao mês</strong>, e <strong>multa compensatória de 10%</strong> sobre o valor total em caso de rescisão por culpa. As arras pagas têm caráter confirmatório (art. 417-420 do CC). Se o(s) COMPRADOR(ES) desistir(em), perderão o sinal; se o(s) VENDEDOR(ES) desistir(em), devolverão o sinal em dobro.</p>

  <h2 style="${h2Style}">Cláusula Sétima — Dos Vícios Ocultos</h2>
  <p style="${pStyle}">O(s) VENDEDOR(ES) declara(m) que o imóvel não possui vícios ocultos que o tornem impróprio para o uso, responsabilizando-se por eventuais vícios redibitórios nos termos dos artigos 441 a 446 do Código Civil.</p>

  <h2 style="${h2Style}">Cláusula Oitava — Do Foro</h2>
  <p style="${pStyle}">As partes elegem o foro da Comarca de <strong>${d.city}</strong> para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.</p>

  <h2 style="${h2Style}">Cláusula Nona — Das Disposições Gerais</h2>
  <p style="${pStyle}">O presente instrumento é celebrado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores. As partes declaram ter lido e compreendido todas as cláusulas, firmando-o de livre e espontânea vontade, em conformidade com o Código Civil Brasileiro (Lei nº 10.406/2002).</p>

  ${assinaturas(d, 'Vendedor', 'Comprador')}
</div>`
}

// ─── TEMPLATE 2: Contrato de Locação ─────────────────────────────────────────

export function generateLocacao(d: ContractData): string {
  const garantiaTexto: Record<string, string> = {
    'caução': 'Caução em dinheiro equivalente a 3 (três) aluguéis, depositada em conta poupança conjunta, nos termos do art. 38 da Lei nº 8.245/91.',
    'fiador': 'Fiança prestada por fiador(es) qualificado(s) em instrumento apartado, que responderá(ão) solidariamente pelo cumprimento das obrigações locatícias.',
    'seguro fiança': 'Seguro fiança, na forma de apólice emitida por seguradora idônea, com cobertura mínima de 12 (doze) meses de aluguel.',
    'título de capitalização': 'Título de capitalização no valor equivalente a 3 (três) aluguéis, em nome do LOCATÁRIO, vinculado a esta locação.',
    'sem garantia': 'Locação sem garantia, nos termos do art. 37 da Lei nº 8.245/91.',
  }

  return `<div style="${estiloBase}">
  <div style="text-align:center;margin-bottom:36px;border-bottom:2px solid #1a1a1a;padding-bottom:18px;">
    <h1 style="${h1Style}">Contrato de Locação Residencial</h1>
    <p style="font-size:10pt;color:#555;margin-top:6px;">Lei nº 8.245/91 (Lei do Inquilinato)</p>
  </div>

  <p style="${pStyle}">Pelo presente instrumento particular, as partes abaixo qualificadas celebram entre si o presente <strong>CONTRATO DE LOCAÇÃO</strong>, que se regerá pelas cláusulas e condições seguintes e, no que couber, pelas disposições da Lei nº 8.245/91:</p>

  <h2 style="${h2Style}">Das Partes</h2>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteA, 'Locador', 'Locadores')}</p>
  <br/>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteB, 'Locatário', 'Locatários')}</p>

  <h2 style="${h2Style}">Cláusula Primeira — Do Objeto</h2>
  <p style="${pStyle}">O(s) LOCADOR(ES) cede(m) ao(s) LOCATÁRIO(S), a título de locação, o imóvel abaixo descrito:</p>
  <p style="margin-left:20px;font-style:italic;">${d.propertyDescription}, situado à <strong>${d.propertyAddress}</strong>, na cidade de <strong>${d.propertyCity}/${d.propertyState}</strong>${d.propertyRegistration ? `, matrícula nº <strong>${d.propertyRegistration}</strong>` : ''}.</p>
  <p style="${pStyle}">O imóvel destina-se exclusivamente à <strong>uso residencial</strong>, sendo vedada qualquer alteração de destinação sem prévia autorização escrita do(s) LOCADOR(ES).</p>

  <h2 style="${h2Style}">Cláusula Segunda — Do Prazo</h2>
  <p style="${pStyle}">A locação é ajustada pelo prazo de <strong>${d.rentDuration || '30 (trinta) meses'}</strong>, com início em <strong>${d.rentStartDate || '___/___/______'}</strong>, findando-se automaticamente na data de término, sem necessidade de notificação. Findo o prazo, caso as partes não manifestem interesse no término, a locação converter-se-á em indeterminada, nos termos do art. 46 da Lei nº 8.245/91.</p>

  <h2 style="${h2Style}">Cláusula Terceira — Do Valor e Encargos</h2>
  <p style="${pStyle}">O aluguel mensal é fixado em <strong>R$ ${d.rentValue || '_______________'}</strong>, a ser pago até o dia <strong>5 (cinco)</strong> de cada mês, mediante <strong>${d.rentPaymentMethod || 'depósito ou transferência bancária (TED/PIX)'}</strong> na conta indicada pelo(s) LOCADOR(ES).</p>
  <p style="${pStyle}"><strong>Encargos adicionais mensais:</strong> ${encargosLocacao(d)}</p>
  <p style="${pStyle}">O valor do aluguel será reajustado anualmente pelo índice <strong>IGP-M/FGV</strong> (ou outro índice oficial que vier a substituí-lo), na data aniversária do contrato, na forma do art. 18 da Lei nº 8.245/91.</p>

  <h2 style="${h2Style}">Cláusula Quarta — Da Garantia Locatícia</h2>
  <p style="${pStyle}">${garantiaTexto[d.rentGuarantee || 'caução'] || d.rentGuarantee || 'Conforme acordado entre as partes.'}</p>

  <h2 style="${h2Style}">Cláusula Quinta — Das Obrigações do(s) Locador(es)</h2>
  <ol style="margin-left:20px;${pStyle}">
    <li>Entregar o imóvel em estado de servir ao uso a que se destina;</li>
    <li>Garantir ao(s) LOCATÁRIO(S) o uso pacífico do imóvel durante o prazo da locação;</li>
    <li>Manter a forma e destino do imóvel;</li>
    <li>Responder pelos vícios ou defeitos anteriores à locação;</li>
    <li>Pagar as taxas de administração imobiliária e de intermediação, se houver.</li>
  </ol>

  <h2 style="${h2Style}">Cláusula Sexta — Das Obrigações do(s) Locatário(s)</h2>
  <ol style="margin-left:20px;${pStyle}">
    <li>Pagar pontualmente o aluguel e os encargos da locação;</li>
    <li>Zelar e conservar o imóvel, utilizando-o com o cuidado de um bom pai de família;</li>
    <li>Restituir o imóvel ao término do contrato nas mesmas condições em que o recebeu;</li>
    <li>Não sublocar, emprestar ou ceder o imóvel sem anuência prévia e escrita do(s) LOCADOR(ES);</li>
    <li>Não realizar obras ou modificações sem autorização por escrito;</li>
    <li>Permitir a vistoria do imóvel pelo(s) LOCADOR(ES) ou seus prepostos, mediante aviso prévio de 24 horas;</li>
    <li>Pagar as despesas de energia elétrica, água, gás e demais serviços de consumo.</li>
  </ol>

  <h2 style="${h2Style}">Cláusula Sétima — Da Multa por Rescisão Antecipada</h2>
  <p style="${pStyle}">Em caso de rescisão antecipada pelo(s) LOCATÁRIO(S), será devida multa proporcional ao tempo restante do contrato, não podendo ultrapassar 3 (três) aluguéis, nos termos do art. 4º da Lei nº 8.245/91. A multa não será exigível se a rescisão ocorrer em virtude de transferência de empregador do LOCATÁRIO, devidamente comprovada.</p>

  <h2 style="${h2Style}">Cláusula Oitava — Do Pagamento em Atraso</h2>
  <p style="${pStyle}">O aluguel pago em atraso ficará sujeito a <strong>multa de 10%</strong> sobre o valor devido, acrescido de <strong>juros de 1% ao mês</strong> e <strong>correção monetária pelo IGP-M</strong>, nos termos do art. 23, I, da Lei nº 8.245/91.</p>

  <h2 style="${h2Style}">Cláusula Nona — Da Vistoria</h2>
  <p style="${pStyle}">Fica lavrado laudo de vistoria em documento apartado, assinado por ambas as partes, que integra o presente instrumento e descreve o estado atual do imóvel. Ao término da locação, nova vistoria será realizada, e os danos causados pelo(s) LOCATÁRIO(S) deverão ser reparados às suas expensas.</p>

  <h2 style="${h2Style}">Cláusula Décima — Do Foro</h2>
  <p style="${pStyle}">As partes elegem o foro da Comarca de <strong>${d.city}</strong> para dirimir quaisquer litígios decorrentes do presente contrato.</p>

  ${assinaturas(d, 'Locador', 'Locatário')}
</div>`
}

// ─── TEMPLATE 3: Permuta ─────────────────────────────────────────────────────

export function generatePermuta(d: ContractData): string {
  return `<div style="${estiloBase}">
  <div style="text-align:center;margin-bottom:36px;border-bottom:2px solid #1a1a1a;padding-bottom:18px;">
    <h1 style="${h1Style}">Instrumento Particular de Contrato de Permuta de Imóveis</h1>
  </div>

  <p style="${pStyle}">Pelo presente instrumento particular, as partes abaixo qualificadas celebram entre si o presente <strong>CONTRATO DE PERMUTA DE IMÓVEIS</strong>, regido pelas disposições dos artigos 533 e seguintes do Código Civil Brasileiro:</p>

  <h2 style="${h2Style}">Das Partes</h2>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteA, 'Permutante A', 'Permutantes A')}</p>
  <br/>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteB, 'Permutante B', 'Permutantes B')}</p>

  <h2 style="${h2Style}">Cláusula Primeira — Do Objeto</h2>
  <p style="${pStyle}">As partes resolvem permutar entre si os seguintes imóveis:</p>
  <p style="${pStyle}"><strong>IMÓVEL DO(S) PERMUTANTE(S) A:</strong><br/>${d.propertyADescription || d.propertyDescription || '___________________________'}</p>
  <p style="${pStyle}"><strong>IMÓVEL DO(S) PERMUTANTE(S) B:</strong><br/>${d.propertyBDescription || '___________________________'}</p>

  <h2 style="${h2Style}">Cláusula Segunda — Das Avaliações e Valor Complementar (Torna)</h2>
  <p style="${pStyle}">As partes concordam com a equivalência dos imóveis permutados, ${d.complementaryValue ? `devendo o(s) PERMUTANTE(S) B pagar ao(s) PERMUTANTE(S) A o valor complementar (torna) de <strong>${d.complementaryValue}</strong>, mediante <strong>${d.complementaryPaymentMethod || '_______________'}</strong>.` : 'não havendo valor de torna a ser pago entre as partes, considerando os imóveis equivalentes.'}${d.paymentConditions ? ` ${d.paymentConditions}` : ''}</p>

  <h2 style="${h2Style}">Cláusula Terceira — Das Obrigações das Partes</h2>
  <ol style="margin-left:20px;${pStyle}">
    <li>Cada parte entregará seu respectivo imóvel livre e desembaraçado de quaisquer ônus, dívidas ou gravames;</li>
    <li>Cada parte responderá pelos débitos fiscais e condominiais de seu imóvel até a data da permuta;</li>
    <li>As despesas de escritura e registro de cada imóvel serão pagas pelo respectivo adquirente;</li>
    <li>O ITBI incidente em cada operação será pago pelo respectivo adquirente;</li>
    <li>A outorga das escrituras definitivas ocorrerá em até ${d.completionDate || '60 (sessenta) dias'} após a assinatura deste instrumento.</li>
  </ol>

  <h2 style="${h2Style}">Cláusula Quarta — Das Garantias e Vícios</h2>
  <p style="${pStyle}">Cada parte garante que os imóveis permutados não possuem vícios ocultos que os tornem improprios ao uso, responsabilizando-se pelos vícios redibitórios na forma dos artigos 441 a 446 do Código Civil, aplicando-se, no que couber, as disposições do contrato de compra e venda conforme o art. 533 do CC.</p>

  <h2 style="${h2Style}">Cláusula Quinta — Da Multa por Descumprimento</h2>
  <p style="${pStyle}">A parte que descumprir quaisquer das obrigações deste instrumento ficará sujeita ao pagamento de multa equivalente a <strong>20% do valor do imóvel de maior valor</strong>, além de perdas e danos apurados.</p>

  <h2 style="${h2Style}">Cláusula Sexta — Do Foro</h2>
  <p style="${pStyle}">As partes elegem o foro da Comarca de <strong>${d.city}</strong> para dirimir quaisquer litígios decorrentes deste contrato.</p>

  ${assinaturas(d, 'Permutante A', 'Permutante B')}
</div>`
}

// ─── TEMPLATE 4: Cessão de Direitos ──────────────────────────────────────────

export function generateCessao(d: ContractData): string {
  return `<div style="${estiloBase}">
  <div style="text-align:center;margin-bottom:36px;border-bottom:2px solid #1a1a1a;padding-bottom:18px;">
    <h1 style="${h1Style}">Instrumento Particular de Cessão de Direitos sobre Imóvel</h1>
  </div>

  <p style="${pStyle}">Pelo presente instrumento particular, as partes abaixo qualificadas celebram entre si o presente <strong>INSTRUMENTO DE CESSÃO DE DIREITOS</strong>, que se regerá pelas cláusulas a seguir e pelas disposições dos artigos 286 e seguintes do Código Civil Brasileiro:</p>

  <h2 style="${h2Style}">Das Partes</h2>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteA, 'Cedente', 'Cedentes')}</p>
  <br/>
  <p style="${pStyle}">${qualificacaoMultipla(d.parteB, 'Cessionário', 'Cessionários')}</p>

  <h2 style="${h2Style}">Cláusula Primeira — Do Objeto da Cessão</h2>
  <p style="${pStyle}">O(s) CEDENTE(S), na qualidade de titular(es) dos direitos abaixo descritos, cede(m) e transfere(m) ao(s) CESSIONÁRIO(S), que aceita(m), a título oneroso, a totalidade dos seguintes direitos:</p>
  <p style="margin-left:20px;font-style:italic;">${d.cessaoObject || d.propertyDescription || '___________________________'}</p>
  <p style="${pStyle}">Referentes ao imóvel situado à <strong>${d.propertyAddress}</strong>, na cidade de <strong>${d.propertyCity}/${d.propertyState}</strong>${d.propertyRegistration ? `, matrícula nº <strong>${d.propertyRegistration}</strong>` : ''}.</p>

  <h2 style="${h2Style}">Cláusula Segunda — Do Valor e Condições de Pagamento</h2>
  <p style="${pStyle}">A presente cessão é ajustada pelo valor de <strong>R$ ${d.totalPrice || '_______________'}</strong>, a ser pago mediante <strong>${d.cessaoPaymentMethod || '_______________'}</strong>${d.paymentConditions ? `, nos seguintes termos: ${d.paymentConditions}` : ', na data da assinatura deste instrumento'}.</p>

  <h2 style="${h2Style}">Cláusula Terceira — Da Posse e Responsabilidade</h2>
  <p style="${pStyle}">Com a assinatura deste instrumento e o pagamento do valor acordado, o(s) CESSIONÁRIO(S) passa(m) a ser o(s) único(s) titular(es) dos direitos ora cedidos, responsabilizando-se integralmente por todas as obrigações decorrentes de sua posse e uso do imóvel.</p>

  <h2 style="${h2Style}">Cláusula Quarta — Das Declarações do(s) Cedente(s)</h2>
  <p style="${pStyle}">O(s) CEDENTE(S) declara(m) que:</p>
  <ol style="margin-left:20px;${pStyle}">
    <li>São os legítimos titulares dos direitos ora cedidos;</li>
    <li>Os direitos cedidos estão livres e desembaraçados de quaisquer ônus, penhoras ou litígios;</li>
    <li>Não existe qualquer impedimento legal ou contratual à presente cessão;</li>
    <li>Todos os valores devidos ao empreendimento/incorporadora/construtora estão quitados até a data deste instrumento.</li>
  </ol>

  <h2 style="${h2Style}">Cláusula Quinta — Da Multa por Descumprimento</h2>
  <p style="${pStyle}">Em caso de descumprimento de qualquer das cláusulas deste instrumento, a parte infratora pagará à outra multa de <strong>20% sobre o valor da cessão</strong>, além das perdas e danos porventura apurados.</p>

  <h2 style="${h2Style}">Cláusula Sexta — Do Foro</h2>
  <p style="${pStyle}">As partes elegem o foro da Comarca de <strong>${d.city}</strong> para dirimir quaisquer litígios decorrentes deste instrumento.</p>

  ${assinaturas(d, 'Cedente', 'Cessionário')}
</div>`
}

// ─── Função principal ─────────────────────────────────────────────────────────

export function generateContract(data: ContractData): string {
  switch (data.type) {
    case 'LOCACAO':            return generateLocacao(data)
    case 'PERMUTA':            return generatePermuta(data)
    case 'CESSAO':             return generateCessao(data)
    case 'PROMESSA_COMPRA_VENDA':
    default:                   return generatePromessaCompraVenda(data)
  }
}
