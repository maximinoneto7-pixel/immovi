import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 as PrismaAdapterSQLite } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbUrl = `file:${path.resolve(process.cwd(), 'dev.db')}`
const adapter = new PrismaAdapterSQLite({ url: dbUrl })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const email = 'maximinoneto.7@gmail.com'
  const password = await bcrypt.hash('admin@ImNaMao2024', 12)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', verified: true, password },
    })
    console.log(`✅ Conta existente atualizada para ADMIN: ${email}`)
  } else {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password,
        role: 'ADMIN',
        verified: true,
      },
    })
    console.log(`✅ Conta ADMIN criada: ${email}`)
  }

  console.log('🔑 Senha: admin@ImNaMao2024')
  console.log('   (altere após o primeiro acesso)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
