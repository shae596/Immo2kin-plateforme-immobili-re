export type UserRole = 'client' | 'proprietaire' | 'agence' | 'admin'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  bio: string | null
  city: string | null
  commune: string | null
  email_verified_at: string | null
  verified_at?: string | null
  is_verified?: boolean
  roles: UserRole[]
  created_at: string | null
  updated_at: string | null
}

export interface AuthResponse {
  message: string
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: UserRole
  phone?: string
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export interface UpdateProfilePayload {
  name?: string
  phone?: string | null
  bio?: string | null
  city?: string | null
  commune?: string | null
  avatar?: string | null
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  code?: string
}
