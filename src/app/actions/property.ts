'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTypedFields } from '@/lib/property-fields'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { notifyMatchingAlerts } from '@/lib/alerts'
import { listingLimitError } from '@/lib/subscription'

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

/** Lê e valida os campos do formulário de anúncio (publicação e edição) */
function readPropertyForm(formData: FormData) {
  const type = formData.get('type') as string
  const {
    area, builtArea, bedrooms, bathrooms, parkingSpaces, furnished, acceptsPets, missingBuiltArea,
  } = parseTypedFields(formData, type)
  const num = (key: string) => (formData.get(key) ? parseFloat(formData.get(key) as string) : null)

  const data = {
    title: ((formData.get('title') as string) || '').trim(),
    description: ((formData.get('description') as string) || '').trim(),
    story: (formData.get('story') as string) || null,
    type,
    listingType: formData.get('listingType') as string,
    price: parseFloat(formData.get('price') as string),
    rentPrice: num('rentPrice'),
    area: area ?? 0,
    builtArea, bedrooms, bathrooms, parkingSpaces, furnished, acceptsPets,
    condoFee: num('condoFee'),
    condoFeeBy: (formData.get('condoFeeBy') as string) || 'LOCATARIO',
    iptu: num('iptu'),
    iptuBy: (formData.get('iptuBy') as string) || 'LOCATARIO',
    videoUrl: (formData.get('videoUrl') as string) || null,
    address: ((formData.get('address') as string) || '').trim(),
    city: ((formData.get('city') as string) || '').trim(),
    state: formData.get('state') as string,
    neighborhood: (formData.get('neighborhood') as string) || null,
    zipCode: (formData.get('zipCode') as string) || null,
  }

  // Capa: a foto escolhida no formulário (antes era sempre a primeira)
  const imageUrls = (formData.getAll('imageUrls') as string[]).filter(Boolean)
  const cover = Number(formData.get('coverIndex') ?? 0)
  const coverIndex = cover >= 0 && cover < imageUrls.length ? cover : 0
  const images = imageUrls.map((url, i) => ({ url, order: i, isCover: i === coverIndex }))

  const features = ((formData.get('features') as string) || '')
    .split('\n').map((f) => f.trim()).filter(Boolean)

  let error: string | null = null
  if (!data.title || !data.description || !type || !data.listingType || !data.price || !area
    || !data.address || !data.city || !data.state) {
    error = 'Preencha todos os campos obrigatórios.'
  } else if (missingBuiltArea) {
    error = 'Informe a área construída da casa.'
  }

  return { data, images, features, error }
}

// Avisa quem tem busca salva compatível (assíncrono — não atrasa a publicação)
function notifyAlertsFor(propertyId: string) {
  prisma.property.findUnique({
    where: { id: propertyId },
    include: { images: { take: 1, orderBy: { order: 'asc' } }, owner: { select: { official: true } } },
  }).then((p) => {
    if (p) notifyMatchingAlerts(p as any).catch(console.error)
  }).catch(console.error)
}

async function createFromForm(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' } as const

  const { data, images, features, error } = readPropertyForm(formData)
  if (error) return { error } as const

  const limitError = await listingLimitError(session.user.id)
  if (limitError) return { error: limitError } as const

  const { lat, lng } = await resolveCoords(formData, data.address, data.city, data.state)
  const property = await prisma.property.create({
    data: {
      ...data,
      ownerId: session.user.id,
      latitude: lat,
      longitude: lng,
      images: { create: images },
      features: { create: features.map((name) => ({ name })) },
    },
  })

  revalidatePath('/imoveis')
  revalidatePath('/')
  notifyAlertsFor(property.id)
  return { propertyId: property.id } as const
}

export async function createProperty(formData: FormData) {
  const result = await createFromForm(formData)
  if ('error' in result) return result
  redirect(`/imoveis/${result.propertyId}`)
}

// Versão sem redirect — retorna o ID para o client fazer upload de documento antes de navegar
export async function createPropertyAndReturn(formData: FormData) {
  return createFromForm(formData)
}

// ─── Gestão do anúncio pelo dono (ou admin) ──────────────────────────────────

async function getManageableProperty(propertyId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autenticado.' } as const

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, ownerId: true, status: true, address: true, city: true, state: true,
      latitude: true, longitude: true, verified: true,
    },
  })
  if (!property || property.status === 'DELETED') return { error: 'Anúncio não encontrado.' } as const

  const isAdmin = session.user.role === 'ADMIN'
  if (property.ownerId !== session.user.id && !isAdmin) {
    return { error: 'Você não pode alterar este anúncio.' } as const
  }
  return { property, isAdmin } as const
}

function revalidateProperty(propertyId: string) {
  revalidatePath('/imoveis')
  revalidatePath('/')
  revalidatePath(`/imoveis/${propertyId}`)
  revalidatePath('/perfil')
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const access = await getManageableProperty(propertyId)
  if ('error' in access) return { error: access.error }
  const { property } = access

  const { data, images, features, error } = readPropertyForm(formData)
  if (error) return { error }

  const addressChanged = data.address !== property.address || data.city !== property.city || data.state !== property.state

  // Endereço novo com o marcador ainda no ponto antigo: localiza de novo pelo endereço
  const formLat = parseFloat(formData.get('latitude') as string)
  const formLng = parseFloat(formData.get('longitude') as string)
  const pinUnchanged = formLat === property.latitude && formLng === property.longitude
  let { lat, lng } = addressChanged && pinUnchanged
    ? await geocode(data.address, data.city, data.state)
    : await resolveCoords(formData, data.address, data.city, data.state)
  if (lat == null || lng == null) {
    lat = property.latitude
    lng = property.longitude
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...data,
      latitude: lat,
      longitude: lng,
      // O selo vem da verificação do documento deste endereço; outro endereço precisa de nova verificação
      ...(addressChanged && property.verified ? { verified: false } : {}),
      images: { deleteMany: {}, create: images },
      features: { deleteMany: {}, create: features.map((name) => ({ name })) },
    },
  })

  revalidateProperty(propertyId)
  return { propertyId, verificationRemoved: addressChanged && property.verified }
}

const MANAGEABLE_STATUS = ['ACTIVE', 'INACTIVE', 'SOLD', 'RENTED', 'DELETED'] as const
export type ManageableStatus = (typeof MANAGEABLE_STATUS)[number]

/** Pausar, reativar, marcar vendido/alugado ou excluir (exclusão só tira do site) */
export async function setPropertyStatus(propertyId: string, status: ManageableStatus) {
  if (!MANAGEABLE_STATUS.includes(status)) return { error: 'Situação inválida.' }

  const access = await getManageableProperty(propertyId)
  if ('error' in access) return { error: access.error }
  const { property, isAdmin } = access

  if (status === 'ACTIVE' && property.status !== 'ACTIVE' && !isAdmin) {
    const limitError = await listingLimitError(property.ownerId, propertyId)
    if (limitError) return { error: limitError }
  }

  await prisma.property.update({ where: { id: propertyId }, data: { status } })
  revalidateProperty(propertyId)
  return { status }
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
    revalidatePath('/favoritos')
    return { favorited: false }
  } else {
    await prisma.favorite.create({ data: { userId, propertyId } })
    revalidatePath('/favoritos')
    return { favorited: true }
  }
}
