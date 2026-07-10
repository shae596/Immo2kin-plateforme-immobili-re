import type {
  PaginatedReservations,
  PropertyAvailability,
  Reservation,
} from '../../types/reservation'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function fetchPropertyAvailability(
  propertyId: number,
  from?: string,
  to?: string,
): Promise<PropertyAvailability> {
  const { data } = await apiClient.get<PropertyAvailability>(
    `/v1/properties/${propertyId}/availability`,
    { params: { from, to } },
  )
  return data
}

export async function fetchMyReservations(page = 1): Promise<PaginatedReservations> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedReservations>('/v1/reservations', {
    params: { page },
  })
  return data
}

export async function fetchOwnerReservations(page = 1): Promise<PaginatedReservations> {
  await initCsrfCookie()
  const { data } = await apiClient.get<PaginatedReservations>(
    '/v1/my/properties/reservations',
    { params: { page },
    },
  )
  return data
}

export async function createReservation(
  propertyId: number,
  payload: {
    start_date: string
    end_date: string
    guests?: number
    message?: string
  },
): Promise<Reservation> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ reservation: Reservation }>(
    `/v1/properties/${propertyId}/reservations`,
    payload,
  )
  return data.reservation
}

export async function confirmReservation(id: number): Promise<Reservation> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ reservation: Reservation }>(
    `/v1/reservations/${id}/confirm`,
  )
  return data.reservation
}

export async function rejectReservation(id: number): Promise<Reservation> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ reservation: Reservation }>(
    `/v1/reservations/${id}/reject`,
  )
  return data.reservation
}

export async function cancelReservation(id: number): Promise<Reservation> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ reservation: Reservation }>(
    `/v1/reservations/${id}/cancel`,
  )
  return data.reservation
}
