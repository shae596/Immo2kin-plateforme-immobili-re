import type { AuthUser } from './auth'
import type { PaginationMeta } from './property'

export interface ReviewSummary {
  average: number | null
  count: number
}

export interface Review {
  id: number
  property_id: number
  user_id: number
  reservation_id: number | null
  rating: number
  comment: string | null
  user?: Pick<AuthUser, 'id' | 'name'>
  created_at: string
  updated_at: string
}

export interface PaginatedReviews {
  data: Review[]
  meta: PaginationMeta & {
    summary: ReviewSummary
    can_review: boolean
  }
}
