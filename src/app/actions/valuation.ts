'use server'

import { prisma } from '@/lib/prisma'
import { computeEstimate, computeBaselineEstimate, type ValuationEstimate } from '@/lib/valuation'
import { sendValuationLeadEmail } from '@/lib/email'

const MIN_COMPARABLES = 3

export async function requestValuation(formData: FormData) {
  const name = (formData.get('name') as string || '').trim()
  const email = (formData.get('email') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim() || null
  const type = formData.get('type') as string
  const listingType = (formData.get('listingType') as string) || 'SALE'
  const city = (formData.get('city') as string || '').trim()
  const state = formData.get('state') as string
  const neighborhood = (formData.get('neighborhood') as string || '').trim() || null
  const area = parseFloat(formData.get('area') as string)
  const bedrooms = formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null

  if (!name || !email || !type || !city || !state || !area || area <= 0) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  // 1. Tenta comparáveis na mesma cidade
  const cityComps = await prisma.property.findMany({
    where: { status: 'ACTIVE', type, city: { equals: city }, state },
    select: { price: true, rentPrice: true, area: true },
  })

  const toPerM2 = (p: { price: number; rentPrice: number | null; area: number }) => {
    const value = listingType === 'RENT' ? (p.rentPrice || p.price) : p.price
    return p.area > 0 ? value / p.area : null
  }

  let estimate: ValuationEstimate
  const cityPerM2 = cityComps.map(toPerM2).filter((v): v is number => v != null && v > 0)

  if (cityPerM2.length >= MIN_COMPARABLES) {
    estimate = computeEstimate(area, type, listingType, cityPerM2.map((pricePerM2) => ({ pricePerM2 })), 'local')
  } else {
    // 2. Amplia para o estado
    const stateComps = await prisma.property.findMany({
      where: { status: 'ACTIVE', type, state },
      select: { price: true, rentPrice: true, area: true },
    })
    const statePerM2 = stateComps.map(toPerM2).filter((v): v is number => v != null && v > 0)

    if (statePerM2.length >= MIN_COMPARABLES) {
      estimate = computeEstimate(area, type, listingType, statePerM2.map((pricePerM2) => ({ pricePerM2 })), 'regional')
    } else {
      // 3. Fallback: valores de referência
      estimate = computeBaselineEstimate(area, type, listingType)
    }
  }

  const lead = await prisma.valuationRequest.create({
    data: {
      name, email, phone, type, listingType, city, state, neighborhood,
      area, bedrooms,
      estimateMin: estimate.estimateMin,
      estimateMax: estimate.estimateMax,
      sampleSize: estimate.sampleSize,
    },
  })

  sendValuationLeadEmail({
    name, email, phone, type, listingType, city, state, neighborhood, area, bedrooms,
    estimateMin: estimate.estimateMin,
    estimateMax: estimate.estimateMax,
  }).catch(console.error)

  return {
    id: lead.id,
    estimateMin: estimate.estimateMin,
    estimateMax: estimate.estimateMax,
    confidence: estimate.confidence,
  }
}
