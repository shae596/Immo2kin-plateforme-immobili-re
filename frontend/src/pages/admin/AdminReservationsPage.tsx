import { useEffect, useState } from 'react'
import { fetchAdminReservations } from '../../services/api/admin'
import type { PaginatedReservations } from '../../types/admin'
import { formatPrice } from '../../types/property'
import { reservationStatusLabel } from '../../types/reservation'
import { getApiErrorMessage } from '../../utils/apiErrors'

export function AdminReservationsPage() {
  const [result, setResult] = useState<PaginatedReservations | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchAdminReservations({ page, status: status || undefined })
      .then(setResult)
      .catch((err) => setError(getApiErrorMessage(err, 'Chargement impossible.')))
      .finally(() => setLoading(false))
  }, [page, status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Réservations</h1>
        <p className="mt-1 text-sm text-slate-600">Suivi global des demandes de location.</p>
      </div>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value)
          setPage(1)
        }}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Tous statuts</option>
        <option value="pending">En attente</option>
        <option value="confirmed">Confirmées</option>
        <option value="cancelled">Annulées</option>
        <option value="rejected">Refusées</option>
      </select>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Annonce</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Payée</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{reservation.user?.name}</p>
                    <p className="text-xs text-slate-500">{reservation.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">{reservation.property?.title ?? `#${reservation.property_id}`}</td>
                  <td className="px-4 py-3">
                    {reservation.start_date} → {reservation.end_date}
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(reservation.total_price, reservation.currency)}
                  </td>
                  <td className="px-4 py-3">{reservationStatusLabel(reservation.status)}</td>
                  <td className="px-4 py-3">
                    {reservation.is_paid || reservation.paid_at ? 'Oui' : 'Non'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
