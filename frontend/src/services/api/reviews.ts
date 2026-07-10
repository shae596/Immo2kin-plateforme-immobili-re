import type { PaginatedReviews, Review } from '../../types/review'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchPropertyReviews(
  propertyId: number,
  page = 1,
): Promise<PaginatedReviews> {
  const { data } = await apiClient.get<PaginatedReviews>(
    `/v1/properties/${propertyId}/reviews`,
    { params: { page } },
  )
  return data
}

export async function createPropertyReview(
  propertyId: number,
  payload: { rating: number; comment?: string },
): Promise<Review> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ review: Review }>(
    `/v1/properties/${propertyId}/reviews`,
    payload,
  )
  return data.review
}

export async function updateReview(
  reviewId: number,
  payload: { rating?: number; comment?: string | null },
): Promise<Review> {
  await initCsrfCookie()
  const { data } = await apiClient.put<{ review: Review }>(
    `/v1/reviews/${reviewId}`,
    payload,
  )
  return data.review
}

export async function deleteReview(reviewId: number): Promise<void> {
  await initCsrfCookie()
  await apiClient.delete(`/v1/reviews/${reviewId}`)
}
