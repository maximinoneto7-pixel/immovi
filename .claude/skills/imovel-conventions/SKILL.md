---
name: imovel-conventions
description: Convenções e regras de governança do projeto Imóvel na Mão (web + app mobile). Use sempre que for programar, revisar ou planejar mudanças neste projeto.
---

# Imóvel na Mão — Convenções do Projeto

Este projeto tem um jeito estabelecido de ser construído. Não fuja dos padrões abaixo sem necessidade.

## Regra de ouro: mudança drástica exige consulta

Antes de fazer qualquer **mudança drástica**, pare e faça duas coisas:
1. **Consulte esta skill e os `AGENTS.md`** dos projetos (web e mobile) para confirmar que a mudança está alinhada com o que já foi decidido.
2. **Pergunte ao usuário** antes de executar — não presuma.

O que conta como "mudança drástica":
- Trocar de biblioteca/provedor já decidido (ex: sair do Asaas, trocar Prisma, trocar de banco, trocar de host)
- Alterar o schema do Prisma de forma destrutiva (remover campos/tabelas, migrations que apagam dados)
- Mudar estrutura de rotas já estabelecida (App Router) ou renomear diretórios centrais
- Mexer em autenticação (NextAuth), pagamentos (Asaas/Stripe) ou verificação de documentos (IA) de forma estrutural
- Qualquer alteração de dados de negócio reais (CNPJ, razão social, contatos) — **nunca invente dados fictícios da empresa**, deixe em branco/placeholder claro até o usuário fornecer os dados reais
- Force push, reset de banco, deploy em produção, mudanças em `vercel.json`/env de produção

O que **não** precisa de consulta prévia (operacional, reversível, de rotina):
- Reiniciar o servidor dev local
- Corrigir bugs pontuais de UI/lógica
- Adicionar campos/telas seguindo o padrão já existente
- Rodar `npx next build`/lint para validar

## Stack e ambiente

- **Next.js 16** (App Router, Turbopack). **Isto NÃO é o Next.js do treinamento** — antes de escrever qualquer código Next.js, leia `node_modules/next/dist/docs/` no projeto web. APIs assíncronas: `params`/`searchParams` são `Promise`, rotas dinâmicas usam `RouteContext<'/path'>`.
- **Mobile (Expo)**: o Expo mudou desde o treinamento. Antes de codar, consultar https://docs.expo.dev/versions/v56.0.0/. Ver `imovel-na-mao-app/AGENTS.md`.
- **Prisma 7**: `provider = "prisma-client"`, output custom. Banco é **agnóstico de ambiente** via `DATABASE_PROVIDER`:
  - Local: `DATABASE_PROVIDER="sqlite"` + `@prisma/adapter-better-sqlite3`
  - Produção: `DATABASE_PROVIDER="postgresql"` (Neon.tech)
  - Lógica em `src/lib/prisma.ts` — não duplicar a instanciação do client em outro lugar.
- **NextAuth v5 beta** — Credentials + Google OAuth (Apple pendente, requer conta paga Apple Developer).
- **Tailwind CSS v4** + Lucide icons + `cn()` utility.
- **Pagamentos**: Asaas é o provedor primário (PIX/Boleto/Cartão, conta real do usuário). Stripe é secundário/alternativo — não remover, mas Asaas é o caminho principal a manter funcionando.
- **E-mail**: Resend (free tier 3.000/mês), fallback para console.log em dev quando `RESEND_API_KEY` não configurada.
- **Verificação de documentos por IA**: Google Gemini (free, recomendado primário) e Anthropic Claude (pago, qualidade maior), com rotação automática de até 5 chaves por provedor (`GOOGLE_AI_API_KEY_1..5`, `ANTHROPIC_API_KEY_1..5`).
- **Mapas**: Leaflet + OpenStreetMap (sem API key). Geocodificação via Nominatim (~1 req/seg, respeitar rate limit).
- **CPF**: validação real do algoritmo da Receita Federal (`src/lib/cpf.ts`), não usar libs de terceiros sem necessidade.
- **LGPD**: páginas de Termos/Privacidade em português, completas e reais — não simplificar.
- **Deploy alvo**: Vercel (host) + Neon.tech (Postgres) + Cloudflare R2 (fotos) + Resend (e-mail). Ver `DEPLOY.md` e `.env.production.example`.

## Dados de negócio — nunca inventar

CNPJ, razão social e dados de contato da empresa **não devem ser inventados**. Se não houver dado real fornecido pelo usuário, deixe o campo em branco ou com placeholder explícito (`[a definir]`), nunca com dado fictício plausível.

## Padrões de código já estabelecidos

- **Server Actions** em `src/app/actions/*.ts` para mutações (ex: `createProperty`/`createPropertyAndReturn`), não criar API routes redundantes para operações que server actions já cobrem.
- **Rotas dinâmicas**: cuidado com colisão de slugs — rotas dinâmicas irmãs no App Router precisam do mesmo nome de parâmetro. Páginas de cidade ficam em `src/app/(main)/cidades/[estado]/[cidade]/`, separado de `imoveis/[id]`, justamente para evitar esse conflito.
- **E-mails transacionais** centralizados em `src/lib/email.ts` (layout HTML único + funções tipadas por evento).
- **Alertas de busca salva**: `src/lib/alerts.ts` → `notifyMatchingAlerts(property)`, chamado de forma assíncrona/non-blocking após criar imóvel (buscar o imóvel de novo com `include: { images }` antes de notificar, pois o retorno do `create()` não inclui relations).
- **Contratos jurídicos**: templates em `src/lib/contract-templates.ts`, suportam múltiplas partes e várias formas de pagamento — manter os 4 tipos (compra e venda, locação, permuta, cessão) consistentes entre si ao alterar um.
- **Mobile app**: `API_URL` está hardcoded como `http://localhost:3001` em cada tela (`HomeScreen`, `SearchScreen`, `PropertyDetailScreen`). Antes de publicar/testar em dispositivo real, trocar para a URL de produção ou ler de `Constants.expoConfig.extra.apiUrl` (já configurado em `app.json`) de forma consistente em todas as telas — isso é uma mudança pendente conhecida, não drástica, mas fazer em todas as telas de uma vez para não deixar inconsistência.
- **ProfileScreen** no mobile é híbrido: a maioria das ações abre a versão web via `Linking.openURL` em vez de telas nativas. Isso é intencional por ora — não migrar para nativo sem alinhar com o usuário primeiro (isso conta como mudança de escopo, ainda que não "drástica").

## Fluxo de trabalho

- Sempre validar com `npx next build` (web) antes de considerar uma tarefa concluída.
- Ao reiniciar o servidor dev no Windows/PowerShell: matar processos node existentes (`Get-Process node | Stop-Process -Force`) e subir de novo em janela própria — hot-reload sozinho não é confiável após mudanças estruturais de rotas.
- Bugs de UI relatados pelo usuário costumam vir de forma terse com screenshot — ler o sintoma visual com cuidado e rastrear até a causa real em Tailwind/flex antes de aplicar correção, em vez de chutar.
