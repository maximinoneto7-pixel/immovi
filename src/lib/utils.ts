import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// A área é sempre guardada em m²; imóvel rural é digitado e exibido em hectares
export const M2_PER_HECTARE = 10_000
export const M2_PER_ALQUEIRE_GOIANO = 48_400

export function isRural(type?: string | null): boolean {
  return type === 'FARM'
}

export function formatArea(area: number, type?: string | null): string {
  if (isRural(type)) {
    return `${(area / M2_PER_HECTARE).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha`
  }
  return `${area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`
}

export function formatAlqueires(area: number, short = false): string {
  const alqueires = area / M2_PER_ALQUEIRE_GOIANO
  const value = alqueires.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (short) return `${value} alq.`
  return `${value} ${alqueires >= 2 ? 'alqueires goianos' : 'alqueire goiano'}`
}

/** Área que o card mostra: construída na casa (quando houver), a total nos demais */
export function mainArea(property: { area: number; builtArea?: number | null; type?: string | null }): number {
  return property.type === 'HOUSE' && property.builtArea ? property.builtArea : property.area
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const PROPERTY_TYPES: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  LAND: 'Terreno',
  FARM: 'Fazenda / Sítio / Chácara',
  COMMERCIAL: 'Comercial',
  OTHER: 'Outro',
}

export const PROPERTY_STATUS: Record<string, string> = {
  ACTIVE: 'Disponível',
  SOLD: 'Vendido',
  RENTED: 'Alugado',
  INACTIVE: 'Pausado',
  PENDING: 'Pendente',
  DELETED: 'Excluído',
}

export const LISTING_TYPES: Record<string, string> = {
  SALE: 'Venda',
  RENT: 'Aluguel',
  BOTH: 'Venda e Aluguel',
}

export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
