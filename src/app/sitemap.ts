import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://immovi.com.br'

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
    { url: `${BASE_URL}/servicos`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/calculadora`, changeFrequency: 'monthly', priority: 0.6 },
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
