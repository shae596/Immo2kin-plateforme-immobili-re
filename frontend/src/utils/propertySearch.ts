import type {
  ListingType,
  PropertySearchFilters,
  PropertySort,
  PropertyStatus,
  PropertyType,
} from '../types/property'

const STRING_KEYS = [
  'q',
  'city',
  'commune',
  'type',
  'listing_type',
  'sort',
  'status',
] as const

const NUMBER_KEYS = [
  'min_price',
  'max_price',
  'min_rooms',
  'min_area',
  'lat',
  'lng',
  'radius_km',
  'page',
  'per_page',
] as const

const BOOL_KEYS = ['has_kitchen', 'has_living_room', 'has_store'] as const

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function parseSearchFilters(
  params: URLSearchParams,
): PropertySearchFilters {
  const filters: PropertySearchFilters = {}

  for (const key of STRING_KEYS) {
    const value = params.get(key)
    if (value) {
      ;(filters as Record<string, string>)[key] = value
    }
  }

  for (const key of NUMBER_KEYS) {
    const n = parseNumber(params.get(key))
    if (n !== undefined) {
      ;(filters as Record<string, number>)[key] = n
    }
  }

  for (const key of BOOL_KEYS) {
    const value = params.get(key)
    if (value === '1' || value === 'true') {
      filters[key] = true
    }
  }

  const amenityIds = params.get('amenity_ids')
  if (amenityIds) {
    const ids = amenityIds
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isFinite(id) && id > 0)
    if (ids.length > 0) {
      filters.amenity_ids = ids
    }
  }

  if (!filters.page) {
    filters.page = 1
  }

  return filters
}

export function searchFiltersToParams(
  filters: PropertySearchFilters,
): URLSearchParams {
  const params = new URLSearchParams()

  for (const key of STRING_KEYS) {
    const value = filters[key]
    if (value) {
      params.set(key, String(value))
    }
  }

  for (const key of NUMBER_KEYS) {
    const value = filters[key]
    if (value !== undefined && value !== null && key !== 'page') {
      params.set(key, String(value))
    }
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page))
  }

  for (const key of BOOL_KEYS) {
    if (filters[key]) {
      params.set(key, '1')
    }
  }

  if (filters.amenity_ids?.length) {
    params.set('amenity_ids', filters.amenity_ids.join(','))
  }

  return params
}

export function filtersToApiParams(
  filters: PropertySearchFilters,
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}

  if (filters.q) params.q = filters.q
  if (filters.city) params.city = filters.city
  if (filters.commune) params.commune = filters.commune
  if (filters.type) params.type = filters.type as PropertyType
  if (filters.listing_type) params.listing_type = filters.listing_type as ListingType
  if (filters.min_price !== undefined) params.min_price = filters.min_price
  if (filters.max_price !== undefined) params.max_price = filters.max_price
  if (filters.min_rooms !== undefined) params.min_rooms = filters.min_rooms
  if (filters.min_area !== undefined) params.min_area = filters.min_area
  if (filters.has_kitchen) params.has_kitchen = true
  if (filters.has_living_room) params.has_living_room = true
  if (filters.has_store) params.has_store = true
  if (
    filters.lat !== undefined &&
    filters.lng !== undefined &&
    filters.radius_km !== undefined
  ) {
    params.lat = filters.lat
    params.lng = filters.lng
    params.radius_km = filters.radius_km
  }
  if (filters.sort) params.sort = filters.sort as PropertySort
  if (filters.status) params.status = filters.status as PropertyStatus
  if (filters.per_page) params.per_page = filters.per_page
  if (filters.page) params.page = filters.page

  if (filters.amenity_ids?.length) {
    filters.amenity_ids.forEach((id, index) => {
      params[`amenity_ids[${index}]`] = id
    })
  }

  return params
}

export function resetSearchPage(
  filters: PropertySearchFilters,
): PropertySearchFilters {
  return { ...filters, page: 1 }
}

export function hasActiveSearchFilters(filters: PropertySearchFilters): boolean {
  return (
    Boolean(filters.q) ||
    Boolean(filters.city) ||
    Boolean(filters.commune) ||
    Boolean(filters.type) ||
    Boolean(filters.listing_type) ||
    filters.min_price !== undefined ||
    filters.max_price !== undefined ||
    filters.min_rooms !== undefined ||
    filters.min_area !== undefined ||
    Boolean(filters.has_kitchen) ||
    Boolean(filters.has_living_room) ||
    Boolean(filters.has_store) ||
    Boolean(filters.amenity_ids?.length) ||
    (filters.lat !== undefined &&
      filters.lng !== undefined &&
      filters.radius_km !== undefined)
  )
}
