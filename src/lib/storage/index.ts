import { writeFile, mkdir } from 'fs/promises'
import { put } from '@vercel/blob'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// ─── Configuração do provider ─────────────────────────────────────────────────
// Produção (Vercel): Vercel Blob — a pasta do servidor é só leitura lá.
// Local: grava em public/uploads. O Blob entra sozinho quando a Vercel injeta
// a credencial do armazenamento conectado ao projeto.

export type StorageProvider = 'local' | 'blob' | 'r2' | 's3'

const PROVIDER: StorageProvider = (process.env.STORAGE_PROVIDER as StorageProvider)
  || (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? 'blob' : 'local')
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
  // Na Vercel a pasta do servidor é só leitura: sem o Blob conectado, avisa em vez de dar erro de sistema
  if (process.env.VERCEL) throw new Error('O envio de fotos está indisponível no momento. Tente novamente em instantes.')
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

// ─── Upload Vercel Blob ───────────────────────────────────────────────────────

async function uploadToBlob(buffer: Buffer, originalName: string, folder: string, contentType: string): Promise<UploadResult> {
  const ext = path.extname(originalName).toLowerCase() || '.jpg'
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
  const blob = await put(`${folder}/${filename}`, buffer, { access: 'public', contentType })
  return { url: blob.url, filename, size: buffer.length, provider: 'blob' }
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
    case 'blob': return uploadToBlob(buffer, file.name, folder, file.type || 'image/jpeg')
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
