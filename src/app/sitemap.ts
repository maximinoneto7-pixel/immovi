import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/site'

/**
 * O mapa do site era gerado uma vez, no build, e só mudava quando havia deploy.
 * Anúncio publicado depois ficava invisível para o Google até alguém mexer no
 * código por outro motivo — foi o que aconteceu com o lote de Moiporá. Agora ele
 * se refaz de hora em hora.
 */
export const revalidate = 3600

// O endereço oficial é o com www: o sem www responde 308 e faria todo buscador
// passar por um desvio. Vem de lib/site, que já normaliza isso.
const BASE_URL = SITE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, cities] = await Promise.all([
    prisma.property.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    }),
    prisma.property.findMany({
      where: { status: 'ACTIVE' },
      select: { city: true, state: true },
      distinct: ['city', 'state'],
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/imoveis`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/planos`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/corretores`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/servicos`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/termos`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacidade`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const propertyPages: MetadataRoute.Sitemap = properties.map(p => ({
    url: `${BASE_URL}/imoveis/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const cityPages: MetadataRoute.Sitemap = cities.map(c => {
    const slug = c.city.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
    return {
      url: `${BASE_URL}/cidades/${c.state.toLowerCase()}/${slug}`,
      changeFrequency: 'daily',
      priority: 0.75,
    }
  })

  return [...staticPages, ...propertyPages, ...cityPages]
}
