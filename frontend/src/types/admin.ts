import type { AuthUser } from '../types/auth'
import type { Payment } from '../types/payment'
import type { Reservation } from '../types/reservation'
import type { Property } from '../types/property'
import type { Verification } from '../types/verification'

export interface ActiveSession {
  session_id: string
  user_id: number
  ip_address: string | null
  user_agent: string | null
  last_activity: string
  user: AuthUser | null
}

export interface ActiveSessionsResponse {
  data: ActiveSession[]
  meta?: {
    session_driver?: string
    session_lifetime_minutes?: number
    total?: number
  }
  message?: string
  code?: string
}

export interface AdminStats {
  users: { total: number; by_role: Record<string, number> }
  properties: { total: number; published: number; draft: number }
  reservations: {
    total: number
    by_status: Record<string, number>
    paid: number
  }
  payments: {
    total: number
    paid: number
    paid_amount: string
    by_method: Record<string, { count: number; amount: string }>
  }
  active_sessions: number
}

export interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PaginatedUsers {
  data: AuthUser[]
  meta: PaginatedMeta
}

export interface PaginatedProperties {
  data: Property[]
  meta: PaginatedMeta
}

export interface PaginatedReservations {
  data: Reservation[]
  meta: PaginatedMeta
}

export interface PaginatedPayments {
  data: Payment[]
  meta: PaginatedMeta
}

export interface PaginatedVerifications {
  data: Verification[]
  meta: PaginatedMeta
}

export const ADMIN_ROLES = ['client', 'proprietaire', 'agence', 'admin'] as const
