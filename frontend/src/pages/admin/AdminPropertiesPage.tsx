import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminProperties } from '../../services/api/admin'
import type { PaginatedProperties } from '../../types/admin'
import { formatPrice } from '../../types/property'
import { getApiErrorMessage } from '../../utils/apiErrors'

export function AdminPropertiesPage() {
  const [result, setResult] = useState<PaginatedProperties | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchAdminProperties({ page, search: search || undefined, status: status || undefined })
      .then(setResult)
      .catch((err) => setError(getApiErrorMessage(err, 'Chargement impossible.')))
      .finally(() => setLoading(false))
  }, [page, search, status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Annonces</h1>
        <p className="mt-1 text-sm text-slate-600">Toutes les annonces de la plateforme.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Titre ou ville…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="published">Publiées</option>
          <option value="draft">Brouillons</option>
        </select>
      </div>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Annonce</th>
                <th className="px-4 py-3">Propriétaire</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.map((property) => (
                <tr key={property.id}>
                  <td className="px-4 py-3">
                    <Link to={`/properties/${property.id}`} className="font-medium text-emerald-700 hover:underline">
                      {property.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {property.commune}, {property.city}
                    </p>
                  </td>
                  <td className="px-4 py-3">{property.owner?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {formatPrice(property.price, property.currency)}
                  </td>
                  <td className="px-4 py-3">{property.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
