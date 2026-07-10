export type PaymentMethod = 'stripe' | 'mobile_money'

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled'

export type MobileMoneyProvider = 'orange' | 'airtel' | 'mpesa'

export interface Payment {
  id: number
  reservation_id: number
  user_id: number
  amount: string
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  provider: string | null
  provider_payment_id: string | null
  mobile_phone: string | null
  instructions: string | null
  paid_at: string | null
  created_at?: string
  updated_at?: string
}

export interface StripeInitResponse {
  message: string
  payment: Payment
  client_secret: string
  stripe_publishable_key: string | null
}

export interface MobileMoneyInitResponse {
  message: string
  payment: Payment
  instructions: string
}

export const MOBILE_MONEY_PROVIDERS: { value: MobileMoneyProvider; label: string }[] = [
  { value: 'orange', label: 'Orange Money' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'mpesa', label: 'M-Pesa' },
]
