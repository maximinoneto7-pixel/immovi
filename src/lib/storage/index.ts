import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// ─── Configuração do provider ─────────────────────────────────────────────────
// Para migrar para Cloudflare R2 no futuro, basta implementar uploadToR2()
// e trocar a linha no final desta função.

export type StorageProvider = 'local' | 'r2' | 's3'

const PROVIDER: StorageProvider = (process.env.STORAGE_PROVIDER as StorageProvider) || 'local'
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export interface UploadResult {
  url: string
  filename: string
  size: number
  provider: StorageProvider
}

// ─── Validação ────────────────────────────────────────────────────────────────

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Formato não suportado. Use: JPG, PNG, WebP ou GIF.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo muito grande. Máximo: 10MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)}MB`
  }
  return null
}

// ─── Upload Local ─────────────────────────────────────────────────────────────

async function uploadToLocal(buffer: Buffer, originalName: string, folder: string): Promise<UploadResult> {
  const dir = path.join(LOCAL_UPLOAD_DIR, folder)
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })

  const ext = path.extname(originalName).toLowerCase() || '.jpg'
  const hash = crypto.randomBytes(8).toString('hex')
  const timestamp = Date.now()
  const filename = `${timestamp}-${hash}${ext}`
  const filepath = path.join(dir, filename)

  await writeFile(filepath, buffer)

  return {
    url: `/uploads/${folder}/${filename}`,
    filename,
    size: buffer.length,
    provider: 'local',
  }
}

// ─── Upload Cloudflare R2 (ativar no futuro) ──────────────────────────────────
// Para ativar:
//   1. npm install @aws-sdk/client-s3
//   2. Adicionar no .env:
//      STORAGE_PROVIDER=r2
//      R2_ACCOUNT_ID=...
//      R2_ACCESS_KEY_ID=...
//      R2_SECRET_ACCESS_KEY=...
//      R2_BUCKET_NAME=imovel-na-mao
//      R2_PUBLIC_URL=https://pub-xxx.r2.dev
//   3. Descomentar a função abaixo

async function uploadToR2(_buffer: Buffer, _originalName: string, _folder: string): Promise<UploadResult> {
  throw new Error('R2 não configurado. Adicione @aws-sdk/client-s3 e as variáveis de ambiente.')
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  folder: string = 'imoveis'
): Promise<UploadResult> {
  const error = validateFile(file)
  if (error) throw new Error(error)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  switch (PROVIDER) {
    case 'r2':  return uploadToR2(buffer, file.name, folder)
    case 'local':
    default:    return uploadToLocal(buffer, file.name, folder)
  }
}

export async function uploadMultiple(
  files: File[],
  folder: string = 'imoveis'
): Promise<UploadResult[]> {
  return Promise.all(files.map(f => uploadFile(f, folder)))
}
