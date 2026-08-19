export interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: number
  publishedAt: string
  author: string
  image: string
  content: string
}

export const POSTS: Post[] = [
  {
    slug: 'como-vender-imovel-rapido',
    title: 'Como vender seu imóvel mais rápido: 10 dicas comprovadas',
    excerpt: 'Descubra as estratégias que os melhores vendedores usam para fechar negócio em menos de 30 dias.',
    category: 'Vendedores',
    readTime: 6,
    publishedAt: '2026-06-01',
    author: 'Equipe Immovi',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    content: `
## Como vender seu imóvel mais rápido

Vender um imóvel pode parecer um processo longo, mas com as estratégias certas é possível fechar negócio em poucas semanas.

### 1. Preço correto desde o início
O erro mais comum é precificar acima do mercado "para ter margem de negociação". Imóveis bem precificados vendem em semanas; os supervalorizados ficam parados por meses.

**Como fazer:** Pesquise imóveis similares vendidos nos últimos 6 meses na mesma região.

### 2. Fotos e vídeo de qualidade
Imóveis com fotos profissionais recebem **3x mais contatos**. Siga nosso Guia de Vídeo Imersivo para criar um tour que coloca o comprador dentro do imóvel.

### 3. Conte a história do lugar
No Immovi, você pode contar o que torna seu imóvel especial — a vizinhança tranquila, a jabuticabeira no quintal, a luz da manhã na sala. Essa humanidade cria conexão emocional com o comprador.

### 4. Disponibilidade para visitas
Responda mensagens em até 2 horas. Compradores interessados perdem o entusiasmo rapidamente se não recebem retorno.

### 5. Documentação em ordem
Tenha em mãos: matrícula atualizada, IPTU, certidões negativas. Imóveis com documentação completa fecham 40% mais rápido.

### 6. Verifique seu imóvel na plataforma
O badge "Verificado" aumenta em até 4x a confiança dos compradores. Suba a matrícula e nossa IA faz a verificação automaticamente.

### 7. Use o Foguete estrategicamente
O recurso Foguete coloca seu imóvel no topo dos resultados por 7, 15 ou 30 dias. Use-o quando quiser acelerar as visualizações.

### 8. Seja flexível nas condições
Aceitar FGTS, financiamento ou entrada parcelada amplia o número de compradores potenciais.

### 9. Cuide da apresentação
Jardim aparado, paredes limpas, lâmpadas funcionando. A primeira impressão física confirma (ou nega) o que o comprador viu nas fotos.

### 10. Chat ativo
Responda perguntas com detalhes. Compradores sérios fazem muitas perguntas antes de marcar visita.

---

**Pronto para vender?** Publique seu anúncio gratuitamente no Immovi e alcance compradores de todo o Brasil.
    `,
  },
  {
    slug: 'checklist-aluguel-seguro',
    title: 'Checklist completo para alugar com segurança',
    excerpt: 'O que verificar antes de assinar o contrato de locação — guia para locadores e locatários.',
    category: 'Locação',
    readTime: 8,
    publishedAt: '2026-06-10',
    author: 'Equipe Immovi',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    content: `
## Checklist completo para alugar com segurança

Alugar um imóvel envolve riscos para ambos os lados. Este checklist ajuda locadores e locatários a se protegerem.

### Para o Locatário

**Antes de assinar:**
- [ ] Vistoriar o imóvel presencialmente
- [ ] Fotografar todos os cômodos e eventuais danos preexistentes
- [ ] Verificar o funcionamento de tomadas, torneiras, chuveiros e fechaduras
- [ ] Confirmar os valores de condomínio e IPTU
- [ ] Checar se há débitos pendentes (água, luz, gás, condomínio)
- [ ] Ler atentamente todas as cláusulas do contrato
- [ ] Confirmar o índice de reajuste (IGPM, IPCA, etc.)

**Documentação a pedir:**
- Matrícula do imóvel atualizada
- Certidão negativa de débitos municipais
- IPTU do ano atual

### Para o Locador

**Antes de alugar:**
- [ ] Fazer vistoria detalhada com fotos e assinatura do locatário
- [ ] Verificar a documentação e renda do locatário
- [ ] Escolher a garantia locatícia (caução, fiador ou seguro fiança)
- [ ] Registrar o contrato em cartório (opcional, mas recomendado)
- [ ] Verificar antecedentes de inadimplência

### Garantias locatícias — qual escolher?

| Garantia | Vantagens | Desvantagens |
|---|---|---|
| Caução | Imediata, simples | Limitada a 3 meses |
| Fiador | Sem custo | Difícil de encontrar |
| Seguro fiança | Ampla cobertura | Tem custo mensal |

### O contrato de locação

No Immovi você gera contratos de locação completos, com todas as cláusulas exigidas pela Lei 8.245/91, incluindo reajuste pelo IGPM, multas e prazos.

---

**Precisa de um contrato?** [Acesse nossa ferramenta de contratos](/contratos/novo?type=LOCACAO) e gere em minutos.
    `,
  },
  {
    slug: 'documentos-compra-imovel',
    title: 'Documentos necessários para comprar um imóvel em 2026',
    excerpt: 'Lista completa de documentos para comprador, vendedor e imóvel — evite surpresas no cartório.',
    category: 'Compradores',
    readTime: 7,
    publishedAt: '2026-06-15',
    author: 'Equipe Immovi',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    content: `
## Documentos necessários para comprar um imóvel

Comprar um imóvel requer uma série de documentos. Ter tudo pronto evita atrasos e problemas no cartório.

### Documentos do Comprador

**Pessoa Física:**
- RG e CPF (ou CNH)
- Comprovante de residência (últimos 3 meses)
- Comprovante de renda (últimos 3 meses)
- Certidão de estado civil atualizada
- Declaração do Imposto de Renda

**Se casado:** documentos do cônjuge também são exigidos.

### Documentos do Vendedor

- RG, CPF e comprovante de residência
- Certidão de estado civil
- Certidão negativa de ações cíveis e criminais
- Certidão negativa de protesto
- Certidão negativa trabalhista

**Se PJ:** CNPJ, contrato social e documentos dos sócios.

### Documentos do Imóvel

- **Matrícula atualizada** (emitida há no máximo 30 dias)
- Certidão negativa de débitos municipais (IPTU)
- Certidão de quitação de condomínio
- Certidão negativa de débitos condominiais
- Declaração de inexistência de débitos de água/luz (quando transferíveis)
- Planta do imóvel aprovada pela Prefeitura (quando disponível)
- Habite-se (para imóveis novos)

### Custos do Cartório

Além dos documentos, prepare-se para pagar:

| Custo | Valor estimado |
|---|---|
| ITBI | 2–3% do valor do imóvel |
| Escritura pública | 0,2–0,5% |
| Registro | 0,1–0,3% |

Use nossa **[Calculadora de Custos](/calculadora)** para simular o total exato.

### Dica importante

Imóveis verificados no Immovi já tiveram a matrícula analisada por nossa IA. O badge "Verificado" indica que confirmamos a titularidade do vendedor.
    `,
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find(p => p.slug === slug)
}

export function getPosts(): Post[] {
  return POSTS.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}
