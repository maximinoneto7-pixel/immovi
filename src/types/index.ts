export type UserRole = 'BUYER' | 'SELLER' | 'AGENT' | 'ADMIN'
export type PropertyType = 'HOUSE' | 'APARTMENT' | 'LAND' | 'FARM' | 'COMMERCIAL' | 'OTHER'
export type PropertyStatus = 'ACTIVE' | 'SOLD' | 'RENTED' | 'INACTIVE' | 'PENDING'
export type ListingType = 'SALE' | 'RENT' | 'BOTH'

export interface PropertyWithOwner {
  id: string
  title: string
  description: string
  story: string | null
  type: string
  status: string
  listingType: string
  price: number
  rentPrice: number | null
  area: number
  bedrooms: number | null
  bathrooms: number | null
  parkingSpaces: number | null
  furnished: boolean
  acceptsPets: boolean
  address: string
  city: string
  state: string
  neighborhood: string | null
  zipCode: string | null
  latitude: number | null
  longitude: number | null
  featured: boolean
  verified: boolean
  views: number
  createdAt: Date
  updatedAt: Date
  ownerId: string
  owner: {
    id: string
    name: string
    email: string
    image: string | null
    phone: string | null
    verified: boolean
    createdAt: Date
  }
  images: {
    id: string
    url: string
    caption: string | null
    isCover: boolean
    order: number
  }[]
  features: {
    id: string
    name: string
  }[]
  _count?: {
    favorites: number
    reviews: number
  }
}

export interface SearchFilters {
  q?: string
  type?: string
  listingType?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
  acceptsPets?: boolean
  page?: number
}
