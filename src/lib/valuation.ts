// Preço/m² de referência (venda), usado apenas quando não há anúncios
// suficientes na base para calcular uma média real. Valores aproximados.
const BASELINE_SALE_PER_M2: Record<string, number> = {
  HOUSE: 3500,
  APARTMENT: 5000,
  LAND: 600,
  FARM: 20,
  COMMERCIAL: 4000,
  OTHER: 3000,
}

// Aluguel mensal estimado como fração do valor de venda por m²
const RENT_RATIO_OF_SALE = 0.005

export function getBaselinePerM2(type: string, listingType: string): number {
  const salePerM2 = BASELINE_SALE_PER_M2[type] ?? BASELINE_SALE_PER_M2.OTHER
  return listingType === 'RENT' ? salePerM2 * RENT_RATIO_OF_SALE : salePerM2
}

export interface ValuationEstimate {
  pricePerM2: number
  estimateMin: number
  estimateMax: number
  sampleSize: number
  confidence: 'baseline' | 'regional' | 'local'
}

export function computeEstimate(
  area: number,
  type: string,
  listingType: string,
  comparables: { pricePerM2: number }[],
  confidence: 'regional' | 'local'
): ValuationEstimate {
  const avg = comparables.reduce((sum, c) => sum + c.pricePerM2, 0) / comparables.length
  return {
    pricePerM2: avg,
    estimateMin: avg * area * 0.9,
    estimateMax: avg * area * 1.1,
    sampleSize: comparables.length,
    confidence,
  }
}

export function computeBaselineEstimate(area: number, type: string, listingType: string): ValuationEstimate {
  const perM2 = getBaselinePerM2(type, listingType)
  return {
    pricePerM2: perM2,
    estimateMin: perM2 * area * 0.85,
    estimateMax: perM2 * area * 1.15,
    sampleSize: 0,
    confidence: 'baseline',
  }
}
