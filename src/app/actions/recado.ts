'use server'

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { sendRecadoEmail } from '@/lib/email'
import { linkDoWhatsapp } from '@/lib/whatsapp'
import { registrar } from '@/lib/registro'
import { avisarErro } from '@/lib/alerta-erro'

/** Quantos recados um mesmo IP pode deixar por hora, somando todos os anúncios */
const LIMITE_POR_HORA = 5

function soDigitos(valor: string) {
  return valor.replace(/\D/g, '')
}

/** (64) 98423-1292 — como o anunciante vai ler no e-mail */
function formatarTelefone(digitos: string) {
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return digitos
}

/**
 * Recado de quem não tem conta.
 *
 * A Immovi ganha por anúncio, não por venda: o que faz o anunciante renovar é
 * receber contato. Exigir cadastro antes da primeira pergunta derruba justamente
 * isso. Aqui o interessado deixa nome e telefone, e o anunciante recebe na hora.
 */
export async function deixarRecado(formData: FormData) {
  try {
    const propertyId = ((formData.get('propertyId') as string) || '').trim()
    const name = ((formData.get('name') as string) || '').trim().slice(0, 80)
    const telefone = soDigitos((formData.get('phone') as string) || '')
    const message = ((formData.get('message') as string) || '').trim().slice(0, 1000)

    // Campo invisível: gente não preenche, robô preenche. Fingimos que deu certo.
    if (((formData.get('site') as string) || '').trim()) return { success: true } as const

    if (name.length < 2) return { error: 'Escreva seu nome para o anunciante saber quem procurou.' } as const
    if (telefone.length < 10 || telefone.length > 11) {
      return { error: 'Informe um telefone com DDD, como (64) 98423-1292.' } as const
    }

    const cabecalhos = await headers()
    const ip = (cabecalhos.get('x-forwarded-for') || '').split(',')[0].trim() || null

    if (ip) {
      const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
      const recentes = await prisma.recado.count({ where: { ip, createdAt: { gte: umaHoraAtras } } })
      if (recentes >= LIMITE_POR_HORA) {
        return { error: 'Você já deixou vários recados agora há pouco. Tente de novo mais tarde.' } as const
      }
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true, title: true, status: true,
        owner: { select: { name: true, email: true, phone: true, showWhatsapp: true } },
      },
    })
    if (!property || property.status !== 'ACTIVE') {
      return { error: 'Este anúncio não está mais disponível.' } as const
    }

    await prisma.recado.create({
      data: { propertyId: property.id, name, phone: formatarTelefone(telefone), message: message || null, ip },
    })

    // O anunciante é avisado depois da resposta: o interessado não espera e-mail
    after(async () => {
      try {
        await sendRecadoEmail({
          to: property.owner.email,
          ownerName: property.owner.name,
          propertyTitle: property.title,
          propertyId: property.id,
          name,
          phone: formatarTelefone(telefone),
          message: message || null,
          linkWhatsapp: linkDoWhatsapp(telefone, `Olá, ${name}! Vi que você se interessou pelo anúncio "${property.title}" na Immovi.`),
        })
        registrar('RECADO_RECEBIDO', { detail: `${property.id} · ${name}` })
      } catch (err) {
        console.error('[Recado] não avisei o anunciante:', err)
        await avisarErro('aviso de recado ao anunciante', err).catch(() => {})
      }
    })

    return { success: true } as const
  } catch (err) {
    await avisarErro('recado sem conta', err).catch(() => {})
    return { error: 'Não consegui enviar agora. Tente de novo em instantes.' } as const
  }
}
