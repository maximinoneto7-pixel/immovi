import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmailConfirmationEmail, sendWelcomeEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

// Confirmação do e-mail no cadastro. Usa a tabela de tokens que já existe, com um
// prefixo próprio para não se misturar com os links de redefinir senha.

const TTL_MS = 24 * 60 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const PREFIX = 'verify:'

export const UNVERIFIED_PUBLISH_ERROR = 'Confirme seu e-mail para publicar anúncios. Reenvie o link pelo aviso no topo da página.'
export const UNVERIFIED_MESSAGE_ERROR = 'Confirme seu e-mail para enviar mensagens. Reenvie o link pelo aviso no topo da página.'

/**
 * Contas criadas antes da confirmação existir continuam livres: elas recebem o aviso
 * no topo do site, mas nada trava para quem já usava a Immovi.
 */
const REQUIRED_FROM = new Date(process.env.EMAIL_CONFIRMATION_FROM || '2026-09-22T20:00:00Z')

/** Quem entrou pelo Google já vem confirmado; só quem usa e-mail e senha precisa do link */
export async function isEmailConfirmed(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } })
  return !!user?.emailVerified
}

/** Pode publicar anúncio e enviar mensagem? */
export async function emailGateOpen(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, createdAt: true },
  })
  if (!user) return false
  return !!user.emailVerified || user.createdAt < REQUIRED_FROM
}

export async function sendVerificationLink(user: { email: string; name: string }) {
  const identifier = `${PREFIX}${user.email}`
  const existing = await prisma.verificationToken.findFirst({ where: { identifier } })

  // Evita reenvio em sequência (o token recém-criado expira daqui a quase 24 h)
  if (existing && existing.expires.getTime() > Date.now() + TTL_MS - RESEND_COOLDOWN_MS) {
    return { success: true, skipped: true }
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TTL_MS) },
  })

  const url = `${SITE_URL}/confirmar-email?token=${token}`
  await sendEmailConfirmationEmail(user.email, user.name, url).catch(console.error)
  return { success: true }
}

/** Confirma o e-mail pelo link. Erra sem dizer se o endereço existe. */
export async function confirmEmailToken(token: string): Promise<{ email: string } | { error: string }> {
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || !record.identifier.startsWith(PREFIX)) {
    return { error: 'Link inválido. Peça um novo para confirmar seu e-mail.' }
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } })
    return { error: 'Este link expirou. Peça um novo para confirmar seu e-mail.' }
  }

  const email = record.identifier.slice(PREFIX.length)
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, role: true, emailVerified: true } })
  if (!user) return { error: 'Conta não encontrada.' }

  if (!user.emailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
    // As boas-vindas só fazem sentido com o e-mail confirmado
    sendWelcomeEmail(user.email, user.name, user.role).catch(console.error)
  }
  await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } })

  return { email }
}
