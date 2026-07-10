import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { fetchMyProperties, updateProperty } from '../services/api/properties'
import type { PaginatedProperties } from '../types/property'
import { propertyStatusBadgeClass, propertyStatusLabel } from '../types/property'

export function MyPropertiesPage() {
  const [result, setResult] = useState<PaginatedProperties | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [publishingId, setPublishingId] = useState<number | null>(null)

  function loadProperties() {
    setLoading(true)
    fetchMyProperties()
      .then(setResult)
      .catch(() => setError('Impossible de charger vos annonces.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProperties()
  }, [])

  async function handlePublish(propertyId: number) {
    setPublishingId(propertyId)
    setError(null)
    try {
      await updateProperty(propertyId, { status: 'published' })
      loadProperties()
    } catch {
      setError('Impossible de publier cette annonce.')
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes annonces</h1>
          <p className="mt-1 text-slate-600">
            Les annonces <strong>publiées</strong> apparaissent chez les clients. Les{' '}
            <strong>brouillons</strong> restent privées jusqu&apos;à publication.
          </p>
        </div>
        <Link
          to="/my/properties/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && result.data.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">Vous n&apos;avez pas encore d&apos;annonce.</p>
          <Link
            to="/my/properties/new"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Créer votre première annonce
          </Link>
        </div>
      )}

      {result && result.data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard property={property} showFavorite={false} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                  className={`rounded px-2 py-0.5 font-medium ${propertyStatusBadgeClass(property.status)}`}
                >
                  {propertyStatusLabel(property.status)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {property.status === 'draft' && (
                    <button
                      type="button"
                      disabled={publishingId === property.id}
                      onClick={() => void handlePublish(property.id)}
                      className="font-medium text-emerald-700 hover:underline disabled:opacity-50"
                    >
                      {publishingId === property.id ? 'Publication…' : 'Publier'}
                    </button>
                  )}
                  <Link
                    to={`/my/properties/${property.id}/edit`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
