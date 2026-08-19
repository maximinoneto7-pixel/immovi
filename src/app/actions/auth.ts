'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/email'

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string
  const role = (formData.get('role') as string) || 'BUYER'
  const cpf = formData.get('cpf') as string
  const creci = formData.get('creci') as string
  const creciState = formData.get('creciState') as string
  const agencyName = formData.get('agencyName') as string

  if (!name || !email || !password) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }
  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }
  if ((role === 'SELLER' || role === 'AGENT') && !phone) {
    return { error: 'Telefone é obrigatório para vendedores e corretores.' }
  }
  if ((role === 'SELLER' || role === 'AGENT') && !cpf) {
    return { error: 'CPF é obrigatório para vendedores e corretores.' }
  }
  if (cpf) {
    const { validarCPF } = await import('@/lib/cpf')
    if (!validarCPF(cpf.replace(/\D/g, ''))) {
      return { error: 'CPF inválido. Verifique o número informado.' }
    }
  }
  if (role === 'AGENT' && !creci) {
    return { error: 'Número do CRECI é obrigatório para corretores.' }
  }
  if (role === 'AGENT' && !creciState) {
    return { error: 'Estado do CRECI é obrigatório.' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Já existe uma conta com este email.' }

  if (cpf) {
    const existingCpf = await prisma.user.findUnique({ where: { cpf } })
    if (existingCpf) return { error: 'CPF já cadastrado.' }
  }

  if (creci) {
    const existingCreci = await prisma.user.findUnique({ where: { creci } })
    if (existingCreci) return { error: 'CRECI já cadastrado. Entre em contato se houver erro.' }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role,
      cpf: cpf || null,
      creci: creci || null,
      creciState: creciState || null,
      agencyName: agencyName || null,
    },
  })

  // E-mail de boas-vindas (não bloqueia o redirect)
  sendWelcomeEmail(email, name, role).catch(console.error)

  redirect('/login?registered=true')
}
