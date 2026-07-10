import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ReservationCard } from '../components/ReservationCard'
import {
  cancelReservation,
  fetchMyReservations,
} from '../services/api/reservations'
import type { PaginatedReservations, Reservation } from '../types/reservation'
import { getApiErrorMessage } from '../utils/apiErrors'

const PaymentDialog = lazy(() =>
  import('../components/PaymentDialog').then((m) => ({ default: m.PaymentDialog })),
)

export function MyReservationsPage() {
  const location = useLocation()
  const [result, setResult] = useState<PaginatedReservations | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [payReservation, setPayReservation] = useState<Reservation | null>(null)
  const [reservationToCancel, setReservationToCancel] = useState<number | null>(null)
  const message = (location.state as { message?: string } | null)?.message ?? null

  useEffect(() => {
    setLoading(true)
    fetchMyReservations(page)
      .then(setResult)
      .catch((err) =>
        setError(getApiErrorMessage(err, 'Impossible de charger vos réservations.')),
      )
      .finally(() => setLoading(false))
  }, [page])

  async function confirmCancel() {
    if (reservationToCancel === null) return
    const id = reservationToCancel
    setBusyId(id)
    try {
      const updated = await cancelReservation(id)
      setReservationToCancel(null)
      setResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          data: prev.data.map((r) => (r.id === id ? updated : r)),
        }
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Annulation impossible.'))
    } finally {
      setBusyId(null)
    }
  }

  function handlePaid(reservationId: number) {
    setPayReservation(null)
    setResult((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        data: prev.data.map((r) =>
          r.id === reservationId
            ? { ...r, is_paid: true, paid_at: new Date().toISOString() }
            : r,
        ),
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes réservations</h1>
        <p className="mt-1 text-slate-600">Suivez vos demandes de location en cours.</p>
      </div>

      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && result.data.length === 0 && !loading && (
        <p className="text-slate-500">
          Aucune réservation. Parcourez les{' '}
          <Link to="/properties" className="text-emerald-700 hover:underline">
            annonces à louer
          </Link>
          .
        </p>
      )}

      <div className="space-y-4">
        {result?.data.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            mode="guest"
            onCancel={setReservationToCancel}
            onPay={setPayReservation}
            busyId={busyId}
          />
        ))}
      </div>

      {result && result.meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="px-3 py-2 text-sm text-slate-600">
            Page {result.meta.current_page} / {result.meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= result.meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

      {payReservation && (
        <Suspense fallback={null}>
          <PaymentDialog
            reservation={payReservation}
            onClose={() => setPayReservation(null)}
            onPaid={() => handlePaid(payReservation.id)}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={reservationToCancel !== null}
        title="Annuler la réservation"
        message="Voulez-vous annuler cette réservation ? Cette action est irréversible."
        confirmLabel="Annuler la réservation"
        variant="danger"
        busy={reservationToCancel !== null && busyId === reservationToCancel}
        busyLabel="Annulation…"
        onConfirm={() => void confirmCancel()}
        onCancel={() => {
          if (busyId === null) setReservationToCancel(null)
        }}
      />
    </div>
  )
}
