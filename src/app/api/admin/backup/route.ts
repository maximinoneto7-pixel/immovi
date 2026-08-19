import { auth } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'dev.db')
const BACKUP_DIR = join(process.cwd(), 'backups')

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })
}

function listBackups() {
  ensureBackupDir()
  return readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .map((file) => {
      const stats = statSync(join(BACKUP_DIR, file))
      return {
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
      }
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function pruneOldBackups(keep = 10) {
  const backups = listBackups()
  backups.slice(keep).forEach((b) => {
    try { unlinkSync(join(BACKUP_DIR, b.name)) } catch {}
  })
}

// GET — lista backups disponíveis
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const backups = listBackups()
  const dbStats = existsSync(DB_PATH) ? statSync(DB_PATH) : null

  return Response.json({
    database: {
      path: DB_PATH,
      size: dbStats?.size || 0,
      lastModified: dbStats?.mtime,
    },
    backups,
    backupDir: BACKUP_DIR,
  })
}

// POST — cria novo backup
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  if (!existsSync(DB_PATH)) {
    return Response.json({ error: 'Banco de dados não encontrado.' }, { status: 404 })
  }

  ensureBackupDir()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupName = `backup-${timestamp}.db`
  const backupPath = join(BACKUP_DIR, backupName)

  const dbContent = readFileSync(DB_PATH)
  writeFileSync(backupPath, dbContent)

  // Mantém apenas os 10 backups mais recentes
  pruneOldBackups(10)

  const stats = statSync(backupPath)

  return Response.json({
    success: true,
    backup: {
      name: backupName,
      size: stats.size,
      createdAt: stats.birthtime,
      path: backupPath,
    },
    message: `Backup criado: ${backupName}`,
  })
}

// DELETE — apaga backup específico
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { name } = await request.json()
  if (!name || !name.endsWith('.db') || name.includes('/') || name.includes('..')) {
    return Response.json({ error: 'Nome de arquivo inválido.' }, { status: 400 })
  }

  const filePath = join(BACKUP_DIR, name)
  if (!existsSync(filePath)) {
    return Response.json({ error: 'Backup não encontrado.' }, { status: 404 })
  }

  unlinkSync(filePath)
  return Response.json({ success: true })
}
