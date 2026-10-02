'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { usarFogueteDoPlano } from '@/lib/foguetes'

/** Gasta um Foguete da cota do plano no anúncio */
export async function destacarComFogueteDoPlano(propertyId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const erro = await usarFogueteDoPlano(session.user.id, propertyId)
  if (erro) return { error: erro }

  revalidatePath(`/imoveis/${propertyId}`)
  revalidatePath('/imoveis')
  revalidatePath('/perfil')
  return { success: true }
}
