'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrar, origemDa } from '@/lib/registro'

/**
 * Confirma o e-mail de alguém na mão.
 *
 * O cadastro novo só publica anúncio depois de confirmar o e-mail. Quando a
 * entrega falha — remetente errado, caixa cheia, filtro de spam — a pessoa fica
 * presa sem nada na tela explicando. Isto destrava, com o administrador
 * assumindo que conferiu de outro jeito que o endereço é daquela pessoa.
 */
export async function confirmarEmailNaMao(userId: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'Só o administrador pode confirmar.' }

  const pessoa = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  })
  if (!pessoa) return { error: 'Usuário não encontrado.' }
  if (pessoa.emailVerified) return { error: 'Este e-mail já está confirmado.' }

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } })

  await registrar('EMAIL_CONFIRMADO_ADMIN', {
    userId: session.user.id,
    email: session.user.email,
    ...origemDa(await headers()),
    detail: `confirmou na mão o e-mail de ${pessoa.email}`,
  })

  revalidatePath('/admin/usuarios')
  return { success: true }
}
