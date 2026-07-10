import { useEffect, useState } from 'react'
import { fetchAdminPayments } from '../../services/api/admin'
import type { PaginatedPayments } from '../../types/admin'
import { formatPrice } from '../../types/property'
import { getApiErrorMessage } from '../../utils/apiErrors'

export function AdminPaymentsPage() {
  const [result, setResult] = useState<PaginatedPayments | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchAdminPayments({
      page,
      status: status || undefined,
      method: method || undefined,
    })
      .then(setResult)
      .catch((err) => setError(getApiErrorMessage(err, 'Chargement impossible.')))
      .finally(() => setLoading(false))
  }, [page, status, method])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paiements</h1>
        <p className="mt-1 text-sm text-slate-600">Stripe et Mobile Money — vue globale.</p>
      </div>

      <div className="flex flex-wrap gap-2">
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
          <option value="processing">En cours</option>
          <option value="paid">Payés</option>
          <option value="failed">Échoués</option>
          <option value="cancelled">Annulés</option>
        </select>
        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value)
            setPage(1)
          }}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Toutes méthodes</option>
          <option value="stripe">Stripe</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
      </div>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Réservation</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3">#{payment.user_id}</td>
                  <td className="px-4 py-3">#{payment.reservation_id}</td>
                  <td className="px-4 py-3">
                    {formatPrice(payment.amount, payment.currency)}
                  </td>
                  <td className="px-4 py-3">{payment.method}</td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {payment.paid_at ?? payment.created_at ?? '—'}
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
