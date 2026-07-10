export type PropertyStatus = 'draft' | 'published' | 'archived'

export type PropertyType =
  | 'appartement'
  | 'maison'
  | 'studio'
  | 'terrain'
  | 'bureau'
  | 'commerce'
  | 'villa'

export type ListingType = 'rent' | 'sale'

export interface Amenity {
  id: number
  name: string
  icon: string | null
}

export interface PropertyImage {
  id: number
  url: string
  sort_order: number
}

export interface PropertyVideo {
  id: number
  url: string
}

export interface ReviewSummary {
  average: number | null
  count: number
}

export interface PropertyOwner {
  id: number
  name: string
  email?: string
  phone?: string | null
  city?: string | null
  commune?: string | null
  is_verified?: boolean
}

export interface Property {
  id: number
  title: string
  description: string | null
  status: PropertyStatus
  price: string
  currency: string
  city: string
  commune: string
  address: string | null
  latitude: string | null
  longitude: string | null
  rooms: number | null
  bathrooms: number | null
  has_kitchen: boolean
  has_living_room: boolean
  has_store: boolean
  area: string | null
  type: PropertyType
  listing_type: ListingType
  owner?: PropertyOwner
  images?: PropertyImage[]
  videos?: PropertyVideo[]
  amenities?: Amenity[]
  is_favorited: boolean
  is_verified?: boolean
  verified_at?: string | null
  reviews_summary?: ReviewSummary
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PaginatedProperties {
  data: Property[]
  meta: PaginationMeta
}

export type PropertySort = 'newest' | 'price_asc' | 'price_desc' | 'area_desc'

export interface PropertyFilters {
  city?: string
  commune?: string
  type?: PropertyType
  min_price?: number
  max_price?: number
  status?: PropertyStatus
  per_page?: number
  page?: number
}

export interface PropertySearchFilters extends PropertyFilters {
  q?: string
  listing_type?: ListingType
  min_rooms?: number
  min_area?: number
  has_kitchen?: boolean
  has_living_room?: boolean
  has_store?: boolean
  amenity_ids?: number[]
  lat?: number
  lng?: number
  radius_km?: number
  sort?: PropertySort
}

export interface PropertyMapMarker {
  id: number
  title: string
  price: string
  currency: string
  type: PropertyType
  listing_type: ListingType
  city: string
  commune: string
  latitude: string
  longitude: string
}

export const PROPERTY_SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: 'newest', label: 'Plus récentes' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'area_desc', label: 'Surface décroissante' },
]

export interface CreatePropertyPayload {
  title: string
  description?: string
  status?: PropertyStatus
  price: number
  currency?: string
  city: string
  commune: string
  address?: string
  latitude?: number
  longitude?: number
  rooms?: number
  bathrooms?: number
  area?: number
  has_kitchen?: boolean
  has_living_room?: boolean
  has_store?: boolean
  type: PropertyType
  listing_type?: ListingType
  amenity_ids?: number[]
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'villa', label: 'Villa' },
]

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'rent', label: 'À louer' },
  { value: 'sale', label: 'À vendre' },
]

const RESIDENTIAL_TYPES: PropertyType[] = [
  'appartement',
  'maison',
  'studio',
  'villa',
]

export function showsRoomComposition(type: PropertyType): boolean {
  return RESIDENTIAL_TYPES.includes(type)
}

export function listingTypeLabel(listingType: ListingType): string {
  return LISTING_TYPES.find((l) => l.value === listingType)?.label ?? listingType
}

export function yesNo(value: boolean): string {
  return value ? 'Oui' : 'Non'
}

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
]

/** Libellés détaillés pour le formulaire propriétaire */
export const PROPERTY_STATUS_OPTIONS: {
  value: PropertyStatus
  label: string
  description: string
}[] = [
  {
    value: 'draft',
    label: 'Brouillon',
    description: 'Visible uniquement dans « Mes annonces ». Les clients ne la voient pas.',
  },
  {
    value: 'published',
    label: 'Publié',
    description: 'Visible par tous les clients (liste, carte, recherche, recommandations).',
  },
  {
    value: 'archived',
    label: 'Archivé',
    description: 'Retirée du catalogue public, conservée dans votre espace.',
  },
]

export function propertyStatusBadgeClass(status: PropertyStatus): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-800'
    case 'draft':
      return 'bg-amber-100 text-amber-900'
    case 'archived':
      return 'bg-slate-200 text-slate-700'
  }
}

export function formatPrice(price: string | number, currency: string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num)
}

export function propertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPES.find((t) => t.value === type)?.label ?? type
}

export function propertyStatusLabel(status: PropertyStatus): string {
  return PROPERTY_STATUSES.find((s) => s.value === status)?.label ?? status
}
