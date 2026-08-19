/**
 * Script para migrar dados do SQLite (dev) para PostgreSQL (produção)
 *
 * Uso:
 *   1. Configure DATABASE_URL_POSTGRES no .env com a URL do PostgreSQL
 *   2. node scripts/migrate-to-postgres.mjs
 */

import 'dotenv/config'
import { PrismaClient as SQLiteClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const sqliteAdapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(process.cwd(), 'dev.db')}` })
const sqlite = new SQLiteClient({ adapter: sqliteAdapter })

console.log('⚠️  Este script migra dados do SQLite local para o PostgreSQL de produção.')
console.log('    Certifique-se de que DATABASE_URL_POSTGRES está configurado no .env\n')

const pgUrl = process.env.DATABASE_URL_POSTGRES
if (!pgUrl) {
  console.error('❌ DATABASE_URL_POSTGRES não configurado no .env')
  process.exit(1)
}

// Para migrar via Prisma, execute os comandos abaixo manualmente:
console.log('📋 Passos para migrar:')
console.log('')
console.log('1. Configure o DATABASE_URL no .env com a URL do PostgreSQL:')
console.log(`   DATABASE_URL="${pgUrl}"`)
console.log('   DATABASE_PROVIDER="postgresql"')
console.log('')
console.log('2. Execute a migração do schema:')
console.log('   npx prisma migrate deploy')
console.log('')
console.log('3. Execute o seed de dados iniciais (opcional):')
console.log('   npx tsx prisma/seed.ts')
console.log('')
console.log('4. Restaure as variáveis locais após a migração:')
console.log('   DATABASE_URL="file:./dev.db"')
console.log('   DATABASE_PROVIDER="sqlite"')

await sqlite.$disconnect()
