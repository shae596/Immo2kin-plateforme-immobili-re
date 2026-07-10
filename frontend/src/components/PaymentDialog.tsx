import { useState } from 'react'
import type { Reservation } from '../types/reservation'
import { formatPrice } from '../types/property'
import { MOBILE_MONEY_PROVIDERS, type MobileMoneyProvider } from '../types/payment'
import {
  confirmMobileMoneyPayment,
  initiateMobileMoneyPayment,
} from '../services/api/payments'
import { getApiErrorMessage } from '../utils/apiErrors'

interface PaymentDialogProps {
  reservation: Reservation
  onClose: () => void
  onPaid: () => void
}

export function PaymentDialog({ reservation, onClose, onPaid }: PaymentDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [phone, setPhone] = useState('')
  const [provider, setProvider] = useState<MobileMoneyProvider>('orange')
  const [mobileInstructions, setMobileInstructions] = useState<string | null>(null)
  const [mobilePaymentId, setMobilePaymentId] = useState<number | null>(null)

  async function startMobileMoney() {
    setError(null)
    setBusy(true)
    try {
      const result = await initiateMobileMoneyPayment(reservation.id, { phone, provider })
      setMobileInstructions(result.instructions)
      setMobilePaymentId(result.payment.id)

      if (result.payment.status === 'paid') {
        onPaid()
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Demande Mobile Money impossible.'))
    } finally {
      setBusy(false)
    }
  }

  async function confirmMobile() {
    if (mobilePaymentId === null) return
    setError(null)
    setBusy(true)
    try {
      await confirmMobileMoneyPayment(mobilePaymentId)
      onPaid()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Confirmation Mobile Money impossible.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Payer la réservation</h2>
            <p className="mt-1 text-sm text-slate-600">
              {formatPrice(reservation.total_price, reservation.currency)} ·{' '}
              {reservation.start_date} → {reservation.end_date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-4 space-y-4">
          {!mobileInstructions && (
            <>
              <p className="text-sm text-slate-600">
                Réglez votre séjour par Mobile Money (Orange, Airtel ou M-Pesa).
              </p>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Opérateur</span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as MobileMoneyProvider)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                >
                  {MOBILE_MONEY_PROVIDERS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Numéro Mobile Money</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0892905498"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <button
                type="button"
                disabled={busy || phone.trim() === ''}
                onClick={startMobileMoney}
                className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {busy ? 'Envoi…' : 'Envoyer la demande de paiement'}
              </button>
            </>
          )}

          {mobileInstructions && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">Instructions</p>
              <p className="whitespace-pre-wrap text-slate-700">{mobileInstructions}</p>
              <button
                type="button"
                disabled={busy}
                onClick={confirmMobile}
                className="rounded-md border border-emerald-700 px-4 py-2 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              >
                {busy ? 'Confirmation…' : 'J\'ai effectué le paiement'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
