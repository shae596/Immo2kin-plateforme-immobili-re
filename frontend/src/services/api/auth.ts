import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from '../../types/auth'
import { initCsrfCookie } from './csrf'
import { apiClient } from './client'

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  await initCsrfCookie()
  const { data } = await apiClient.post<AuthResponse>('/v1/auth/register', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  await initCsrfCookie()
  const { data } = await apiClient.post<AuthResponse>('/v1/auth/login', payload)
  return data
}

export async function logout(): Promise<void> {
  await initCsrfCookie()
  await apiClient.post('/v1/auth/logout')
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.get<MeResponse>('/v1/auth/me', {
      timeout: 8000,
    })
    return data.user
  } catch {
    return null
  }
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthResponse> {
  await initCsrfCookie()
  const { data } = await apiClient.put<AuthResponse>('/v1/auth/profile', payload)
  return data
}

export async function resendVerificationEmail(): Promise<{ message: string }> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ message: string }>(
    '/v1/auth/email/verification-notification',
  )
  return data
}

export async function verifyEmail(
  id: string,
  hash: string,
  query: string,
): Promise<{ message: string }> {
  await initCsrfCookie()
  const { data } = await apiClient.get<{ message: string }>(
    `/v1/auth/email/verify/${id}/${hash}?${query}`,
  )
  return data
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ message: string }>(
    '/v1/auth/forgot-password',
    { email },
  )
  return data
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  await initCsrfCookie()
  const { data } = await apiClient.post<{ message: string }>(
    '/v1/auth/reset-password',
    payload,
  )
  return data
}
