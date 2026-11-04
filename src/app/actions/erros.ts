'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/** Marca um erro como resolvido. Se voltar a acontecer, ele se reabre sozinho. */
export async function marcarResolvido(id: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'Sem permissão.' } as const

  await prisma.erroRegistrado.update({
    where: { id },
    data: { resolvidoEm: new Date() },
  })
  revalidatePath('/admin/erros')
  return { success: true } as const
}

/** Tira da lista um erro já tratado, quando não interessa mais nem o histórico */
export async function apagarErro(id: string) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'Sem permissão.' } as const

  await prisma.erroRegistrado.delete({ where: { id } })
  revalidatePath('/admin/erros')
  return { success: true } as const
}
