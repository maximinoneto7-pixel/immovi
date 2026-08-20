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

  // PostgreSQL (Neon) em produção — adapter obrigatório desde o Prisma 7
  const { PrismaNeon } = require('@prisma/adapter-neon')
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter } as any)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
