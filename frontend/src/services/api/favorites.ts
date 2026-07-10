import type { PaginatedProperties } from '../../types/property'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchFavorites(page = 1): Promise<PaginatedProperties> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedProperties>('/v1/favorites', {
    params: { page },
  })
  return data
}

export async function addFavorite(propertyId: number): Promise<void> {
  await initCsrfCookie()
  await apiClient.post(`/v1/favorites/${propertyId}`)
}

export async function removeFavorite(propertyId: number): Promise<void> {
  await initCsrfCookie()
  await apiClient.delete(`/v1/favorites/${propertyId}`)
}
