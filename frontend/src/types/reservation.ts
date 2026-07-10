export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected'

export interface BlockedRange {
  start_date: string
  end_date: string
  status: ReservationStatus
}

export interface PropertyAvailability {
  property_id: number
  blocked_ranges: BlockedRange[]
  min_nights: number
  max_advance_days: number
}

export interface ReservationPropertySummary {
  id: number
  title: string
  city: string
  commune: string
  price?: string
  currency?: string
  listing_type?: string
  owner?: { id: number; name: string } | null
}

export interface ReservationUserSummary {
  id: number
  name: string
  email?: string
  phone?: string | null
}

export interface Reservation {
  id: number
  property_id: number
  user_id: number
  start_date: string
  end_date: string
  status: ReservationStatus
  guests: number | null
  nights: number
  total_price: string
  currency: string
  message: string | null
  paid_at?: string | null
  is_paid?: boolean
  can_review?: boolean
  property?: ReservationPropertySummary
  user?: ReservationUserSummary
  created_at?: string
  updated_at?: string
}

export interface PaginatedReservations {
  data: Reservation[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  rejected: 'Refusée',
}

export function reservationStatusLabel(status: ReservationStatus): string {
  return RESERVATION_STATUS_LABELS[status] ?? status
}

export function reservationStatusClass(status: ReservationStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800'
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800'
    case 'cancelled':
      return 'bg-slate-100 text-slate-700'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
