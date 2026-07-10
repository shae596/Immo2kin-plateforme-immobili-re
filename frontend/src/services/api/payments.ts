import type {
  MobileMoneyInitResponse,
  MobileMoneyProvider,
  Payment,
  StripeInitResponse,
} from '../../types/payment'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function initiateStripePayment(
  reservationId: number,
): Promise<StripeInitResponse> {
  await initCsrfCookie()
  const { data } = await apiClient.post<StripeInitResponse>(
    `/v1/reservations/${reservationId}/payments/stripe`,
  )
  return data
}

export async function confirmStripePayment(paymentId: number): Promise<Payment> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ payment: Payment }>(
    `/v1/payments/${paymentId}/stripe/confirm`,
  )
  return data.payment
}

export async function initiateMobileMoneyPayment(
  reservationId: number,
  payload: { phone: string; provider: MobileMoneyProvider },
): Promise<MobileMoneyInitResponse> {
  await initCsrfCookie()
  const { data } = await apiClient.post<MobileMoneyInitResponse>(
    `/v1/reservations/${reservationId}/payments/mobile-money`,
    payload,
  )
  return data
}

export async function confirmMobileMoneyPayment(paymentId: number): Promise<Payment> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ payment: Payment }>(
    `/v1/payments/${paymentId}/mobile-money/confirm`,
  )
  return data.payment
}
