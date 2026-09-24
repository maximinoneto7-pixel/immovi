'use server'

import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

/**
 * Encerramento de conta pedido pela própria pessoa.
 *
 * O perfil some do site e o dado pessoal é apagado. Nome e CPF vão para um arquivo
 * restrito (só a administração vê) quando houve contrato ou pagamento: sem eles o
 * contrato não se sustenta e o registro fiscal fica incompleto — é a exceção do
 * art. 16 da LGPD. Quem nunca negociou não deixa nada para trás.
 */
export async function encerrarConta(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const senha = (formData.get('senha') as string) || ''
  const confirmacao = (formData.get('confirmacao') as string) || ''

  if (confirmacao.trim().toUpperCase() !== 'ENCERRAR') {
    return { error: 'Escreva ENCERRAR para confirmar.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, cpf: true, password: true, deletedAt: true,
      _count: { select: { contracts: true, subscriptions: true, properties: true } },
    },
  })
  if (!user) return { error: 'Conta não encontrada.' }
  if (user.deletedAt) return { error: 'Esta conta já foi encerrada.' }

  // Conta com senha exige a senha; conta só com Google confirma pelo texto
  if (user.password) {
    if (!senha) return { error: 'Informe sua senha para confirmar.' }
    const confere = await bcrypt.compare(senha, user.password)
    if (!confere) return { error: 'Senha incorreta.' }
  }

  const negociou = user._count.contracts > 0 || user._count.subscriptions > 0

  await prisma.$transaction(async (tx) => {
    // O que só serve a quem saiu
    await tx.favorite.deleteMany({ where: { userId: user.id } })
    await tx.savedSearch.deleteMany({ where: { userId: user.id } })
    await tx.pushSubscription.deleteMany({ where: { userId: user.id } })
    await tx.session.deleteMany({ where: { userId: user.id } })
    await tx.account.deleteMany({ where: { userId: user.id } })

    // Anúncios saem do ar
    await tx.property.updateMany({
      where: { ownerId: user.id, status: { not: 'DELETED' } },
      data: { status: 'DELETED', featured: false },
    })

    await tx.user.update({
      where: { id: user.id },
      data: {
        // O site inteiro passa a mostrar assim
        name: 'Usuário removido',
        // Libera o endereço para a pessoa poder criar outra conta um dia
        email: `removido+${user.id}@immovi.invalid`,
        password: null,
        phone: null,
        bio: null,
        image: null,
        cpf: null,
        creci: null,
        creciState: null,
        agencyName: null,
        agencyPhone: null,
        city: null,
        state: null,
        showActivity: false,
        priceAlerts: false,
        lastSeenAt: null,
        deletedAt: new Date(),
        // Arquivo restrito: só quando existe contrato ou pagamento para sustentar
        archivedName: negociou ? user.name : null,
        archivedCpf: negociou ? user.cpf : null,
      },
    })
  })

  revalidatePath('/imoveis')
  revalidatePath('/')
  await signOut({ redirectTo: '/?conta=encerrada' })
  return { ok: true }
}
