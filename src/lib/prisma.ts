import { PrismaClient } from '@/generated/prisma/client'

function createPrismaClient() {
  const provider = process.env.DATABASE_PROVIDER || 'sqlite'

  if (provider === 'sqlite') {
    // SQLite local — usa adapter better-sqlite3
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const url = process.env.DATABASE_URL || 'file:./dev.db'
    const adapter = new PrismaBetterSqlite3({ url })
    return new PrismaClient({ adapter } as any)
  }

  // PostgreSQL / MySQL em produção — conexão via URL direta
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  } as any)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
