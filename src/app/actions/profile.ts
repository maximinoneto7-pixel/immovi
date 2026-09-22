'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validarCPF } from '@/lib/cpf'
import bcrypt from 'bcryptjs'

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const name = (formData.get('name') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const bio = (formData.get('bio') as string || '').trim()
  const cpf = (formData.get('cpf') as string || '').trim()
  const city = (formData.get('city') as string || '').trim()
  const state = (formData.get('state') as string || '').trim()
  const image = (formData.get('image') as string || '').trim()
  const creci = (formData.get('creci') as string || '').trim()
  const creciState = (formData.get('creciState') as string || '').trim()
  const agencyName = (formData.get('agencyName') as string || '').trim()
  const agencyPhone = (formData.get('agencyPhone') as string || '').trim()
  const showActivity = formData.get('showActivity') === 'true'

  if (!name) return { error: 'Nome é obrigatório.' }

  if (cpf) {
    if (!validarCPF(cpf.replace(/\D/g, ''))) {
      return { error: 'CPF inválido. Verifique o número informado.' }
    }
    const existingCpf = await prisma.user.findUnique({ where: { cpf } })
    if (existingCpf && existingCpf.id !== session.user.id) {
      return { error: 'Este CPF já está cadastrado em outra conta.' }
    }
  }

  if (creci) {
    const existingCreci = await prisma.user.findUnique({ where: { creci } })
    if (existingCreci && existingCreci.id !== session.user.id) {
      return { error: 'Este CRECI já está cadastrado em outra conta.' }
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      bio: bio || null,
      cpf: cpf || null,
      city: city || null,
      state: state || null,
      image: image || null,
      creci: creci || null,
      creciState: creciState || null,
      agencyName: agencyName || null,
      agencyPhone: agencyPhone || null,
      showActivity,
    },
  })

  revalidatePath('/perfil')
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!newPassword || newPassword.length < 6) {
    return { error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })
  if (!user) return { error: 'Usuário não encontrado.' }

  // Contas criadas via Google, por exemplo, podem não ter senha ainda —
  // nesse caso não há senha atual para conferir, só define a nova.
  if (user.password) {
    if (!currentPassword) return { error: 'Informe sua senha atual.' }
    const matches = await bcrypt.compare(currentPassword, user.password)
    if (!matches) return { error: 'Senha atual incorreta.' }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  return { success: true }
}
