import { prisma } from '@/lib/prisma'
import { sendPriceDropEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
import { absoluteUrl } from '@/lib/site'
import { formatCurrency } from '@/lib/utils'

// Aviso de baixa de preço para quem favoritou o imóvel.
// Só quando o preço cai, só em anúncio ativo e no máximo um aviso por imóvel por semana.

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

/** O preço que o anúncio mostra: aluguel usa o valor mensal */
export function shownPrice(p: { listingType: string; price: number; rentPrice?: number | null }): number {
  return p.listingType === 'RENT' ? (p.rentPrice ?? p.price) : p.price
}

export async function notifyPriceDrop(propertyId: string, oldPrice: number, newPrice: number) {
  if (!(newPrice > 0) || newPrice >= oldPrice) return

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, title: true, city: true, state: true, status: true, ownerId: true, priceAlertAt: true,
      images: { orderBy: { order: 'asc' }, select: { url: true, isCover: true } },
    },
  })
  if (!property || property.status !== 'ACTIVE') return

  // Um aviso por imóvel por semana, para não virar spam de quem mexe no preço várias vezes
  if (property.priceAlertAt && Date.now() - property.priceAlertAt.getTime() < COOLDOWN_MS) return

  const favorites = await prisma.favorite.findMany({
    where: {
      propertyId,
      userId: { not: property.ownerId },
      user: { priceAlerts: true },
    },
    select: { user: { select: { id: true, name: true, email: true } } },
  })
  if (favorites.length === 0) return

  const cover = property.images.find((img) => img.isCover) || property.images[0]
  const image = cover ? absoluteUrl(cover.url) : null

  await Promise.all(
    favorites.map(async ({ user }) => {
      await sendPriceDropEmail(user.email, user.name, { ...property, image }, oldPrice, newPrice).catch(console.error)
      await sendPushToUser(user.id, {
        title: `Baixou de preço: ${property.title}`,
        body: `De ${formatCurrency(oldPrice)} para ${formatCurrency(newPrice)} · ${property.city} – ${property.state}`,
        url: `/imoveis/${property.id}`,
      }).catch(console.error)
    })
  )

  await prisma.property.update({ where: { id: propertyId }, data: { priceAlertAt: new Date() } })
}
