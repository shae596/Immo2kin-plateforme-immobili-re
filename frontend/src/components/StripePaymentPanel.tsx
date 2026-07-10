import { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { confirmStripePayment } from '../services/api/payments'
import { getApiErrorMessage } from '../utils/apiErrors'

interface StripePaymentPanelProps {
  paymentId: number
  clientSecret: string
  publishableKey: string
  onSuccess: () => void
  onError: (message: string) => void
  onSimulatedConfirm: () => void
  simulatedBusy: boolean
}

function StripeCheckoutForm({
  paymentId,
  onSuccess,
  onError,
}: {
  paymentId: number
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!stripe || !elements) return

    setBusy(true)
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (result.error) {
        onError(result.error.message ?? 'Paiement refusé.')
        return
      }

      await confirmStripePayment(paymentId)
      onSuccess()
    } catch (err) {
      onError(getApiErrorMessage(err, 'Échec du paiement Stripe.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {busy ? 'Traitement…' : 'Payer avec Stripe'}
      </button>
    </form>
  )
}

export function StripePaymentPanel({
  paymentId,
  clientSecret,
  publishableKey,
  onSuccess,
  onError,
  onSimulatedConfirm,
  simulatedBusy,
}: StripePaymentPanelProps) {
  const stripePromise: Promise<Stripe | null> | null = publishableKey
    ? loadStripe(publishableKey)
    : null

  if (!stripePromise) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p>
          Mode développement : Stripe simulé (aucune clé publique configurée). Cliquez pour confirmer
          le paiement test.
        </p>
        <button
          type="button"
          disabled={simulatedBusy}
          onClick={onSimulatedConfirm}
          className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {simulatedBusy ? 'Confirmation…' : 'Confirmer le paiement test'}
        </button>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutForm paymentId={paymentId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
