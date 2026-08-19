// Prisma 7 exige que datasource.provider seja um literal (não aceita env()).
// Este script troca esse literal no schema.prisma para bater com DATABASE_PROVIDER
// do .env (local) ou das variáveis de ambiente (Vercel), antes de `prisma generate`.
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma')

// Carrega .env manualmente (sem depender de dotenv) só para ler DATABASE_PROVIDER
let provider = process.env.DATABASE_PROVIDER
if (!provider) {
  const envPath = join(__dirname, '..', '.env')
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf-8').match(/^DATABASE_PROVIDER\s*=\s*"?([\w-]+)"?/m)
    provider = match?.[1]
  }
}
provider = provider || 'sqlite'

if (provider !== 'sqlite' && provider !== 'postgresql') {
  console.error(`[set-prisma-provider] DATABASE_PROVIDER inválido: "${provider}" (use "sqlite" ou "postgresql")`)
  process.exit(1)
}

const schema = readFileSync(schemaPath, 'utf-8')
const updated = schema.replace(
  /(datasource db \{[^}]*provider\s*=\s*)"[\w-]+"/,
  `$1"${provider}"`
)

if (updated === schema) {
  console.log(`[set-prisma-provider] Provider já é "${provider}" — nada a fazer.`)
} else {
  writeFileSync(schemaPath, updated)
  console.log(`[set-prisma-provider] schema.prisma atualizado para provider = "${provider}"`)
}
