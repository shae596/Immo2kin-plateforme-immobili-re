import { useEffect, useState } from 'react'
import {
  approveAdminVerification,
  fetchAdminVerifications,
  rejectAdminVerification,
} from '../../services/api/admin'
import type { Verification } from '../../types/verification'
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_TYPE_LABELS,
} from '../../types/verification'
import { getApiErrorMessage } from '../../utils/apiErrors'

export function AdminVerificationsPage() {
  const [items, setItems] = useState<Verification[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({})
  const [acting, setActing] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetchAdminVerifications({ page, status: status || undefined })
      .then((result) => {
        setItems(result.data)
        setLastPage(result.meta.last_page)
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Chargement impossible.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, status])

  async function handleApprove(id: number) {
    setActing(id)
    try {
      await approveAdminVerification(id, adminNotes[id])
      load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Action impossible.'))
    } finally {
      setActing(null)
    }
  }

  async function handleReject(id: number) {
    setActing(id)
    try {
      await rejectAdminVerification(id, adminNotes[id])
      load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Action impossible.'))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vérifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Valider la légitimité des annonces (titre foncier, conformité du bien).
        </p>
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
        <option value="approved">Approuvées</option>
        <option value="rejected">Refusées</option>
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">Aucune demande.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((v) => (
            <li key={v.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{VERIFICATION_TYPE_LABELS[v.type]}</p>
                  <p className="text-sm text-slate-600">
                    {v.user?.name} ({v.user?.email})
                  </p>
                  {v.property && (
                    <p className="text-sm text-slate-500">Annonce : {v.property.title}</p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {VERIFICATION_STATUS_LABELS[v.status]}
                </span>
              </div>
              {v.notes && <p className="mt-2 text-sm text-slate-700">{v.notes}</p>}
              {v.status === 'pending' && (
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    placeholder="Note admin (optionnel)"
                    value={adminNotes[v.id] ?? ''}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={acting === v.id}
                      onClick={() => void handleApprove(v.id)}
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      disabled={acting === v.id}
                      onClick={() => void handleReject(v.id)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              )}
              {v.admin_notes && (
                <p className="mt-2 text-xs text-slate-400">Note : {v.admin_notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="py-1 text-sm text-slate-600">
            Page {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
