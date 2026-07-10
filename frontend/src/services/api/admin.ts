import type {
  ActiveSessionsResponse,
  AdminStats,
  PaginatedPayments,
  PaginatedProperties,
  PaginatedReservations,
  PaginatedUsers,
  PaginatedVerifications,
} from '../../types/admin'
import type { Verification } from '../../types/verification'
import type { AuthUser } from '../../types/auth'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchActiveSessions(): Promise<ActiveSessionsResponse> {
  await initCsrfCookie()
  const { data } = await apiClient.get<ActiveSessionsResponse>(
    '/v1/admin/active-sessions',
  )
  return data
}

export async function fetchAdminStats(): Promise<AdminStats> {
  await initCsrfCookie()
  const { data } = await apiClient.get<{ stats: AdminStats }>('/v1/admin/stats')
  return data.stats
}

export async function fetchAdminUsers(params?: {
  page?: number
  search?: string
  role?: string
}): Promise<PaginatedUsers> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedUsers>('/v1/admin/users', { params })
  return data
}

export async function createAdminUser(payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: string
  phone?: string
  email_verified?: boolean
}): Promise<AuthUser> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ user: AuthUser }>('/v1/admin/users', payload)
  return data.user
}

export async function updateAdminUser(
  id: number,
  payload: Record<string, unknown>,
): Promise<AuthUser> {
  await initCsrfCookie()
  const { data } = await apiClient.put<{ user: AuthUser }>(`/v1/admin/users/${id}`, payload)
  return data.user
}

export async function deleteAdminUser(id: number): Promise<void> {
  await initCsrfCookie()
  await apiClient.delete(`/v1/admin/users/${id}`)
}

export async function fetchAdminProperties(params?: {
  page?: number
  search?: string
  status?: string
}): Promise<PaginatedProperties> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedProperties>('/v1/admin/properties', {
    params,
  })
  return data
}

export async function fetchAdminReservations(params?: {
  page?: number
  status?: string
}): Promise<PaginatedReservations> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedReservations>(
    '/v1/admin/reservations',
    { params },
  )
  return data
}

export async function fetchAdminPayments(params?: {
  page?: number
  status?: string
  method?: string
}): Promise<PaginatedPayments> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedPayments>('/v1/admin/payments', { params })
  return data
}

export async function fetchAdminVerifications(params?: {
  page?: number
  status?: string
  type?: string
}): Promise<PaginatedVerifications> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedVerifications>(
    '/v1/admin/verifications',
    { params },
  )
  return data
}

export async function approveAdminVerification(
  id: number,
  adminNotes?: string,
): Promise<Verification> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ verification: Verification }>(
    `/v1/admin/verifications/${id}/approve`,
    { admin_notes: adminNotes },
  )
  return data.verification
}

export async function rejectAdminVerification(
  id: number,
  adminNotes?: string,
): Promise<Verification> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ verification: Verification }>(
    `/v1/admin/verifications/${id}/reject`,
    { admin_notes: adminNotes },
  )
  return data.verification
}
