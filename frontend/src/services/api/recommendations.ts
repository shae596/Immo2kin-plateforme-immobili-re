import type {
  RecommendationsResponse,
  SimilarPropertiesResponse,
} from '../../types/recommendation'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchRecommendations(limit = 8): Promise<RecommendationsResponse> {
  const { data } = await apiClient.get<RecommendationsResponse>('/v1/recommendations', {
    params: { limit },
  })
  return data
}

export async function fetchSimilarProperties(
  propertyId: number,
  limit = 6,
): Promise<SimilarPropertiesResponse> {
  const { data } = await apiClient.get<SimilarPropertiesResponse>(
    `/v1/properties/${propertyId}/similar`,
    { params: { limit } },
  )
  return data
}

export async function trackRecommendationEvent(payload: {
  event_type: string
  property_id?: number
  metadata?: Record<string, unknown>
}): Promise<void> {
  await initCsrfCookie()
  await apiClient.post('/v1/recommendation-events', payload)
}
