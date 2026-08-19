import { prisma } from '@/lib/prisma'
import { sendPropertyAlertEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'

interface Property {
  id: string
  title: string
  type: string
  listingType: string
  price: number
  rentPrice?: number | null
  area: number
  bedrooms?: number | null
  city: string
  state: string
  images: { url: string; isCover: boolean }[]
}

interface SearchFilters {
  type?: string
  listingType?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  q?: string
}

function matchesFilters(property: Property, filters: SearchFilters): boolean {
  if (filters.type && property.type !== filters.type) return false
  if (filters.listingType && property.listingType !== filters.listingType) return false
  if (filters.state && property.state.toLowerCase() !== filters.state.toLowerCase()) return false
  if (filters.city && !property.city.toLowerCase().includes(filters.city.toLowerCase())) return false

  const price = property.listingType === 'RENT' ? (property.rentPrice || property.price) : property.price
  if (filters.minPrice && price < filters.minPrice) return false
  if (filters.maxPrice && price > filters.maxPrice) return false
  if (filters.minArea && property.area < filters.minArea) return false
  if (filters.maxArea && property.area > filters.maxArea) return false
  if (filters.bedrooms && (property.bedrooms || 0) < filters.bedrooms) return false

  if (filters.q) {
    const q = filters.q.toLowerCase()
    if (!property.title.toLowerCase().includes(q) &&
        !property.city.toLowerCase().includes(q)) return false
  }

  return true
}

export async function notifyMatchingAlerts(property: Property) {
  try {
    // Busca todos os alertas ativos que não pertencem ao dono do imóvel
    const searches = await prisma.savedSearch.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001'

    for (const search of searches) {
      let filters: SearchFilters
      try {
        filters = JSON.parse(search.filters)
      } catch {
        continue
      }

      if (!matchesFilters(property, filters)) continue

      // Monta URL da busca para o e-mail
      const urlParams = new URLSearchParams()
      if (filters.type) urlParams.set('type', filters.type)
      if (filters.listingType) urlParams.set('listingType', filters.listingType)
      if (filters.city) urlParams.set('city', filters.city)
      if (filters.state) urlParams.set('state', filters.state)
      if (filters.minPrice) urlParams.set('minPrice', String(filters.minPrice))
      if (filters.maxPrice) urlParams.set('maxPrice', String(filters.maxPrice))
      const searchUrl = `${BASE_URL}/imoveis?${urlParams.toString()}`

      const cover = property.images?.find(i => i.isCover) || property.images?.[0]

      await sendPropertyAlertEmail(
        search.user.email,
        search.user.name,
        search.name,
        [{
          id: property.id,
          title: property.title,
          price: property.listingType === 'RENT' ? (property.rentPrice || property.price) : property.price,
          city: property.city,
          state: property.state,
          type: property.type,
          image: cover?.url,
        }],
        searchUrl
      ).catch(console.error)

      sendPushToUser(search.user.id, {
        title: `Novo imóvel: ${search.name}`,
        body: property.title,
        url: `${BASE_URL}/imoveis/${property.id}`,
      }).catch(console.error)

      // Atualiza a data da última notificação
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: new Date() },
      })
    }
  } catch (err) {
    console.error('[Alertas] Erro ao notificar:', err)
  }
}
