import type { PaginatedVerifications, Verification } from '../../types/verification'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchMyVerifications(page = 1): Promise<PaginatedVerifications> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedVerifications>('/v1/verifications', {
    params: { page },
  })
  return data
}

export async function submitVerification(payload: {
  property_id: number
  notes?: string
}): Promise<Verification> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ verification: Verification }>(
    '/v1/verifications',
    { ...payload, type: 'property' },
  )
  return data.verification
}
