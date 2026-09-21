import { M2_PER_HECTARE } from '@/lib/utils'

/** Campos que cada tipo de imóvel usa no formulário de anúncio (e que o servidor aceita) */
export interface TypeFields {
  areaLabel: string
  builtArea: 'required' | 'optional' | null
  bedrooms: boolean
  bathroomsAndParking: boolean
  furnishedAndPets: boolean
}

export const TYPE_FIELDS: Record<string, TypeFields> = {
  HOUSE: { areaLabel: 'Área do terreno (m²)', builtArea: 'required', bedrooms: true, bathroomsAndParking: true, furnishedAndPets: true },
  APARTMENT: { areaLabel: 'Área útil (m²)', builtArea: null, bedrooms: true, bathroomsAndParking: true, furnishedAndPets: true },
  LAND: { areaLabel: 'Área do terreno (m²)', builtArea: null, bedrooms: false, bathroomsAndParking: false, furnishedAndPets: false },
  FARM: { areaLabel: 'Área total (hectares)', builtArea: null, bedrooms: false, bathroomsAndParking: false, furnishedAndPets: false },
  COMMERCIAL: { areaLabel: 'Área (m²)', builtArea: 'optional', bedrooms: false, bathroomsAndParking: true, furnishedAndPets: false },
  OTHER: { areaLabel: 'Área (m²)', builtArea: 'optional', bedrooms: true, bathroomsAndParking: true, furnishedAndPets: true },
}

export function typeFields(type: string | null | undefined): TypeFields {
  return TYPE_FIELDS[type || ''] || TYPE_FIELDS.OTHER
}

/** Benfeitorias sugeridas para imóvel rural — gravadas como características do imóvel */
export const RURAL_IMPROVEMENTS = [
  'Casa sede', 'Casa de caseiro', 'Curral', 'Galpão / Barracão', 'Paiol', 'Represa / Açude',
  'Poço artesiano', 'Nascente', 'Córrego / Rio', 'Energia elétrica', 'Cercas e divisas',
  'Pastagem formada', 'Área de lavoura', 'Pomar', 'Chiqueiro', 'Galinheiro',
]

/**
 * Lê medidas e cômodos do formulário conforme o tipo. Campos que o tipo não usa
 * são descartados, e a área rural chega em hectares e é convertida para m².
 */
export function parseTypedFields(formData: FormData, type: string) {
  const fields = typeFields(type)
  const num = (key: string) => {
    const raw = (formData.get(key) as string | null)?.trim().replace(',', '.')
    const n = raw ? parseFloat(raw) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const int = (key: string) => {
    const raw = formData.get(key) as string | null
    return raw ? parseInt(raw) : null
  }

  const areaInput = num('area')
  const builtArea = fields.builtArea ? num('builtArea') : null

  return {
    area: areaInput === null ? null : type === 'FARM' ? Math.round(areaInput * M2_PER_HECTARE) : areaInput,
    builtArea,
    bedrooms: fields.bedrooms ? int('bedrooms') : null,
    bathrooms: fields.bathroomsAndParking ? int('bathrooms') : null,
    parkingSpaces: fields.bathroomsAndParking ? int('parkingSpaces') : null,
    furnished: fields.furnishedAndPets && formData.get('furnished') === 'true',
    acceptsPets: fields.furnishedAndPets && formData.get('acceptsPets') === 'true',
    missingBuiltArea: fields.builtArea === 'required' && builtArea === null,
  }
}
