'use server'

import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  if (!email) return { error: 'Informe seu e-mail.' }

  const user = await prisma.user.findUnique({ where: { email } })

  // Não revela se o e-mail existe ou não — mesma resposta nos dois casos
  if (user) {
    // Limpa tokens antigos desse e-mail antes de criar um novo
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    const token = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}&email=${encodeURIComponent(email)}`

    sendPasswordResetEmail(user.email, user.name, resetUrl).catch(console.error)
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const token = formData.get('token') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !token) return { error: 'Link inválido ou incompleto.' }
  if (!newPassword || newPassword.length < 6) {
    return { error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || record.identifier !== email || record.expires < new Date()) {
    return { error: 'Link inválido ou expirado. Solicite um novo.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: 'Usuário não encontrado.' }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  return { success: true }
}
