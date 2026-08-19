# Guia de Deploy — Immovi

## Stack de Produção
- **Hosting:** Vercel (grátis para começar)
- **Banco:** Neon.tech — PostgreSQL serverless (grátis até 0.5GB)
- **Armazenamento:** Cloudflare R2 (grátis 10GB)
- **E-mail:** Resend (grátis 3.000/mês)

---

## PASSO 1 — GitHub

1. Acesse **github.com** e crie uma conta
2. Crie um repositório: `immovi`
3. No terminal do projeto:

```bash
git init
git add .
git commit -m "feat: Immovi — versão inicial"
git remote add origin https://github.com/SEU_USUARIO/immovi.git
git push -u origin main
```

---

## PASSO 2 — Banco PostgreSQL (Neon.tech)

1. Acesse **neon.tech** → criar conta gratuita
2. Criar projeto: `immovi`, região: `South America (São Paulo)`
3. Copiar a **Connection String** (formato: `postgresql://...`)
4. Guardar para o Passo 4

---

## PASSO 3 — Armazenamento de Fotos (Cloudflare R2)

1. Acesse **dash.cloudflare.com** → R2
2. Criar bucket: `immovi`
3. Configurar domínio público no bucket
4. Criar API token com permissão de leitura/escrita
5. Guardar: Account ID, Access Key ID, Secret Access Key

---

## PASSO 4 — Deploy no Vercel

1. Acesse **vercel.com** → conectar com GitHub
2. Importar repositório `immovi`
3. Na aba **Environment Variables**, adicionar:

```
DATABASE_URL=postgresql://... (URL do Neon)
DATABASE_PROVIDER=postgresql
NEXTAUTH_SECRET=gere com: openssl rand -base64 32
NEXTAUTH_URL=https://immovi.com.br

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

RESEND_API_KEY=re_...
EMAIL_FROM=Immovi <noreply@immovi.com.br>

STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=immovi
R2_PUBLIC_URL=https://pub-xxx.r2.dev

GOOGLE_AI_API_KEY=AIza... (verificação de documentos)
ASAAS_API_KEY=$aact_...
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_TOKEN=token_secreto
```

4. Clicar em **Deploy**

---

## PASSO 5 — Migrar banco de dados

Após o deploy inicial, no terminal local:

```bash
# 1. Temporariamente aponte para o PostgreSQL
export DATABASE_URL="postgresql://..."
export DATABASE_PROVIDER="postgresql"

# 2. Execute as migrações
npx prisma migrate deploy

# 3. (Opcional) Popular com dados iniciais
npx tsx prisma/seed.ts

# 4. Restaure o .env local
```

---

## PASSO 6 — Domínio próprio (opcional)

No Vercel: **Settings → Domains → Add**
- Ex: `immovi.com.br`
- Atualizar `NEXTAUTH_URL` e `EMAIL_FROM` com o domínio real
- Atualizar URI de callback do Google OAuth

---

## PASSO 7 — Webhook Asaas em produção

No painel Asaas:
- URL: `https://immovi.com.br/api/asaas/webhook`
- Token: mesmo valor do `ASAAS_WEBHOOK_TOKEN`

---

## Checklist pré-lançamento

- [ ] Banco PostgreSQL criado e migrado
- [ ] Deploy no Vercel funcionando
- [ ] Google OAuth com URL de produção
- [ ] E-mails sendo enviados (testar cadastro)
- [ ] Upload de fotos via R2
- [ ] Pagamentos Asaas em modo produção
- [ ] Domínio próprio configurado
- [ ] SSL ativo (automático no Vercel)
- [ ] Criar conta admin: `npx tsx scripts/create-admin.ts`
