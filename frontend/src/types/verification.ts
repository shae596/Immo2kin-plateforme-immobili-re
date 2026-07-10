import type { AuthUser } from './auth'
import type { PaginationMeta } from './property'

export type VerificationType = 'identity' | 'property'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface VerificationProperty {
  id: number
  title: string
  is_verified: boolean
}

export interface Verification {
  id: number
  user_id: number
  property_id: number | null
  type: VerificationType
  status: VerificationStatus
  notes: string | null
  admin_notes: string | null
  reviewed_at: string | null
  user?: AuthUser
  property?: VerificationProperty
  created_at: string
  updated_at: string
}

export interface PaginatedVerifications {
  data: Verification[]
  meta: PaginationMeta & {
    is_verified?: boolean
  }
}

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  identity: 'Identité (désactivé)',
  property: 'Légitimité de l\'annonce',
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
}
