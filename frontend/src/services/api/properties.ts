import type {
  Amenity,
  CreatePropertyPayload,
  PaginatedProperties,
  Property,
  PropertyFilters,
  PropertyMapMarker,
  PropertySearchFilters,
  UpdatePropertyPayload,
} from '../../types/property'
import { filtersToApiParams } from '../../utils/propertySearch'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'
import type { AxiosRequestConfig } from 'axios'

/** Axios doit définir lui-même le boundary multipart (pas de Content-Type JSON par défaut). */
function multipartUploadConfig(): AxiosRequestConfig {
  return {
    transformRequest: [
      (data, headers) => {
        if (headers && typeof headers === 'object') {
          delete headers['Content-Type']
        }
        return data
      },
    ],
  }
}

function buildParams(
  filters: PropertyFilters | PropertySearchFilters,
): Record<string, string | number | boolean> {
  if ('q' in filters || 'sort' in filters || 'listing_type' in filters) {
    return filtersToApiParams(filters as PropertySearchFilters)
  }

  const params: Record<string, string | number> = {}
  if (filters.city) params.city = filters.city
  if (filters.commune) params.commune = filters.commune
  if (filters.type) params.type = filters.type
  if (filters.min_price !== undefined) params.min_price = filters.min_price
  if (filters.max_price !== undefined) params.max_price = filters.max_price
  if (filters.status) params.status = filters.status
  if (filters.per_page) params.per_page = filters.per_page
  if (filters.page) params.page = filters.page
  return params
}

export async function fetchProperties(
  filters: PropertySearchFilters = {},
): Promise<PaginatedProperties> {
  const { data } = await apiClient.get<PaginatedProperties>('/v1/properties', {
    params: buildParams(filters),
  })
  return data
}

export async function fetchPropertyMapMarkers(
  filters: PropertySearchFilters = {},
): Promise<PropertyMapMarker[]> {
  const { data } = await apiClient.get<{ data: PropertyMapMarker[] }>(
    '/v1/properties/map',
    { params: buildParams(filters) },
  )
  return data.data
}

export async function fetchMyProperties(
  filters: PropertyFilters = {},
): Promise<PaginatedProperties> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedProperties>('/v1/my/properties', {
    params: buildParams(filters),
  })
  return data
}

export async function fetchProperty(id: number): Promise<Property> {
  const { data } = await apiClient.get<{ property: Property }>(
    `/v1/properties/${id}`,
  )
  return data.property
}

export async function createProperty(
  payload: CreatePropertyPayload,
): Promise<Property> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ property: Property }>(
    '/v1/properties',
    payload,
  )
  return data.property
}

export async function updateProperty(
  id: number,
  payload: UpdatePropertyPayload,
): Promise<Property> {
  await initCsrfCookie()
  const { data } = await apiClient.put<{ property: Property }>(
    `/v1/properties/${id}`,
    payload,
  )
  return data.property
}

export async function deleteProperty(id: number): Promise<void> {
  await initCsrfCookie()
  await apiClient.delete(`/v1/properties/${id}`)
}

export async function uploadPropertyImage(
  propertyId: number,
  file: File,
  sortOrder = 0,
): Promise<void> {
  await initCsrfCookie()
  const formData = new FormData()
  formData.append('image', file)
  formData.append('sort_order', String(sortOrder))
  await apiClient.post(`/v1/properties/${propertyId}/images`, formData, multipartUploadConfig())
}

export async function deletePropertyImage(
  propertyId: number,
  imageId: number,
): Promise<void> {
  await initCsrfCookie()
  await apiClient.delete(`/v1/properties/${propertyId}/images/${imageId}`)
}

export async function fetchAmenities(): Promise<Amenity[]> {
  const { data } = await apiClient.get<{ data: Amenity[] }>('/v1/amenities')
  return data.data
}
