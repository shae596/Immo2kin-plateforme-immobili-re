import { useEffect, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ReservationCard } from '../components/ReservationCard'
import {
  cancelReservation,
  confirmReservation,
  fetchOwnerReservations,
  rejectReservation,
} from '../services/api/reservations'
import type { PaginatedReservations } from '../types/reservation'
import { getApiErrorMessage } from '../utils/apiErrors'

export function OwnerReservationsPage() {
  const [result, setResult] = useState<PaginatedReservations | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reservationToCancel, setReservationToCancel] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchOwnerReservations(page)
      .then(setResult)
      .catch((err) =>
        setError(getApiErrorMessage(err, 'Impossible de charger les demandes.')),
      )
      .finally(() => setLoading(false))
  }, [page])

  function updateReservation(id: number, updated: PaginatedReservations['data'][0]) {
    setResult((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        data: prev.data.map((r) => (r.id === id ? updated : r)),
      }
    })
  }

  async function runAction(
    id: number,
    action: 'confirm' | 'reject' | 'cancel',
  ) {
    setBusyId(id)
    setError(null)
    try {
      const updated =
        action === 'confirm'
          ? await confirmReservation(id)
          : action === 'reject'
            ? await rejectReservation(id)
            : await cancelReservation(id)
      updateReservation(id, updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Action impossible.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Réservations reçues</h1>
        <p className="mt-1 text-slate-600">
          Confirmez ou refusez les demandes sur vos annonces à louer.
        </p>
      </div>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && result.data.length === 0 && !loading && (
        <p className="text-slate-500">Aucune demande de réservation pour le moment.</p>
      )}

      <div className="space-y-4">
        {result?.data.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            mode="owner"
            onConfirm={(id) => void runAction(id, 'confirm')}
            onReject={(id) => void runAction(id, 'reject')}
            onCancel={setReservationToCancel}
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

      <ConfirmDialog
        open={reservationToCancel !== null}
        title="Annuler la réservation"
        message="Voulez-vous annuler cette réservation ? Cette action est irréversible."
        confirmLabel="Annuler la réservation"
        variant="danger"
        busy={reservationToCancel !== null && busyId === reservationToCancel}
        busyLabel="Annulation…"
        onConfirm={() => {
          if (reservationToCancel !== null) {
            void runAction(reservationToCancel, 'cancel').finally(() =>
              setReservationToCancel(null),
            )
          }
        }}
        onCancel={() => {
          if (busyId === null) setReservationToCancel(null)
        }}
      />
    </div>
  )
}
