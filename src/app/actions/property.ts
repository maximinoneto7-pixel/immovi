'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTypedFields } from '@/lib/property-fields'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { notifyMatchingAlerts } from '@/lib/alerts'

// Geocodifica endereço via Nominatim (OpenStreetMap)
async function geocode(address: string, city: string, state: string) {
  try {
    const query = `${address}, ${city}, ${state}, Brasil`
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}&countrycodes=br`,
      { headers: { 'User-Agent': 'Immovi/1.0', 'Accept-Language': 'pt-BR' } }
    )
    const data = await res.json()
    if (data?.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /* silencioso */ }
  return { lat: null, lng: null }
}

// Usa a posição marcada pelo usuário no mapa; se não houver, geocodifica pelo endereço
async function resolveCoords(formData: FormData, address: string, city: string, state: string) {
  const formLat = formData.get('latitude')
  const formLng = formData.get('longitude')
  if (formLat && formLng) {
    return { lat: parseFloat(formLat as string), lng: parseFloat(formLng as string) }
  }
  return geocode(address, city, state)
}

export async function createProperty(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const story = formData.get('story') as string
  const type = formData.get('type') as string
  const listingType = formData.get('listingType') as string
  const price = parseFloat(formData.get('price') as string)
  const rentPrice = formData.get('rentPrice') ? parseFloat(formData.get('rentPrice') as string) : null
  const {
    area, builtArea, bedrooms, bathrooms, parkingSpaces, furnished, acceptsPets, missingBuiltArea,
  } = parseTypedFields(formData, type)
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const neighborhood = formData.get('neighborhood') as string
  const zipCode = formData.get('zipCode') as string
  const imageUrls = formData.getAll('imageUrls') as string[]
  const features = (formData.get('features') as string || '').split('\n').filter(Boolean)
  const condoFee = formData.get('condoFee') ? parseFloat(formData.get('condoFee') as string) : null
  const condoFeeBy = formData.get('condoFeeBy') as string || 'LOCATARIO'
  const iptu = formData.get('iptu') ? parseFloat(formData.get('iptu') as string) : null
  const iptuBy = formData.get('iptuBy') as string || 'LOCATARIO'
  const videoUrl = (formData.get('videoUrl') as string) || null

  if (!title || !description || !type || !listingType || !price || !area || !address || !city || !state) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }
  if (missingBuiltArea) return { error: 'Informe a área construída da casa.' }

  const property = await prisma.property.create({
    data: {
      title,
      description,
      story: story || null,
      type,
      listingType,
      price,
      rentPrice,
      area,
      builtArea,
      bedrooms,
      bathrooms,
      parkingSpaces,
      furnished,
      acceptsPets,
      condoFee,
      condoFeeBy,
      iptu,
      iptuBy,
      videoUrl,
      address,
      city,
      state,
      neighborhood: neighborhood || null,
      zipCode: zipCode || null,
      ownerId: session.user.id,
      images: {
        create: imageUrls.filter(Boolean).map((url, i) => ({
          url,
          order: i,
          isCover: i === 0,
        })),
      },
      features: {
        create: features.map((name) => ({ name: name.trim() })),
      },
      // Localização: usa o ponto marcado no mapa, com geocodificação automática como fallback
      ...await resolveCoords(formData, address, city, state).then(({ lat, lng }) => ({
        latitude: lat,
        longitude: lng,
      })),
    },
  })

  revalidatePath('/imoveis')
  revalidatePath('/')

  // Notifica alertas ativos (assíncrono) — busca imagens separado para não bloquear
  prisma.property.findUnique({
    where: { id: property.id },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  }).then(p => {
    if (p) notifyMatchingAlerts(p as any).catch(console.error)
  }).catch(console.error)

  redirect(`/imoveis/${property.id}`)
}

// Versão sem redirect — retorna o ID para o client fazer upload de documento antes de navegar
export async function createPropertyAndReturn(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const story = formData.get('story') as string
  const type = formData.get('type') as string
  const listingType = formData.get('listingType') as string
  const price = parseFloat(formData.get('price') as string)
  const rentPrice = formData.get('rentPrice') ? parseFloat(formData.get('rentPrice') as string) : null
  const {
    area, builtArea, bedrooms, bathrooms, parkingSpaces, furnished, acceptsPets, missingBuiltArea,
  } = parseTypedFields(formData, type)
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const neighborhood = formData.get('neighborhood') as string
  const zipCode = formData.get('zipCode') as string
  const imageUrls = formData.getAll('imageUrls') as string[]
  const features = (formData.get('features') as string || '').split('\n').filter(Boolean)
  const condoFee = formData.get('condoFee') ? parseFloat(formData.get('condoFee') as string) : null
  const condoFeeBy = formData.get('condoFeeBy') as string || 'LOCATARIO'
  const iptu = formData.get('iptu') ? parseFloat(formData.get('iptu') as string) : null
  const iptuBy = formData.get('iptuBy') as string || 'LOCATARIO'
  const videoUrl = (formData.get('videoUrl') as string) || null

  if (!title || !description || !type || !listingType || !price || !area || !address || !city || !state) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }
  if (missingBuiltArea) return { error: 'Informe a área construída da casa.' }

  const property = await prisma.property.create({
    data: {
      title, description, story: story || null, type, listingType,
      price, rentPrice, area, builtArea, bedrooms, bathrooms, parkingSpaces,
      furnished, acceptsPets, condoFee, condoFeeBy, iptu, iptuBy, videoUrl,
      address, city, state,
      neighborhood: neighborhood || null, zipCode: zipCode || null,
      ownerId: session.user.id,
      images: { create: imageUrls.filter(Boolean).map((url, i) => ({ url, order: i, isCover: i === 0 })) },
      features: { create: features.map((name) => ({ name: name.trim() })) },
      ...await resolveCoords(formData, address, city, state).then(({ lat, lng }) => ({
        latitude: lat, longitude: lng,
      })),
    },
  })

  revalidatePath('/imoveis')
  revalidatePath('/')
  return { propertyId: property.id }
}

export async function toggleFavorite(propertyId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' }

  const userId = session.user.id
  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { userId_propertyId: { userId, propertyId } } })
    return { favorited: false }
  } else {
    await prisma.favorite.create({ data: { userId, propertyId } })
    return { favorited: true }
  }
}
