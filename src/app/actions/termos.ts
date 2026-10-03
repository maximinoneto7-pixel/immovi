'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { origemDa, registrar } from '@/lib/registro'
import { TERMOS_VERSAO } from '@/lib/termos'

/** Guarda o aceite da versão em vigor dos Termos */
export async function aceitarTermos() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Entre na sua conta para aceitar.' }

  const origem = origemDa(await headers())

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      termsVersion: TERMOS_VERSAO,
      termsAcceptedAt: new Date(),
      termsAcceptedIp: origem.ip,
    },
  })

  await registrar('TERMOS_ACEITOS', {
    userId: session.user.id,
    email: session.user.email,
    ...origem,
    detail: `versão ${TERMOS_VERSAO}`,
  })

  revalidatePath('/')
  return { success: true }
}
