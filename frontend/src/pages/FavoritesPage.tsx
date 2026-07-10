import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { fetchFavorites } from '../services/api/favorites'
import type { PaginatedProperties } from '../types/property'

export function FavoritesPage() {
  const [result, setResult] = useState<PaginatedProperties | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
      .then(setResult)
      .catch(() => setError('Impossible de charger vos favoris.'))
      .finally(() => setLoading(false))
  }, [])

  function handleFavoriteChange(propertyId: number, isFavorited: boolean) {
    if (isFavorited) return
    setResult((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        data: prev.data.filter((p) => p.id !== propertyId),
        meta: { ...prev.meta, total: prev.meta.total - 1 },
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes favoris</h1>
        <p className="mt-1 text-slate-600">
          Annonces que vous avez enregistrées.
        </p>
      </div>

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && result.data.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">Aucun favori pour le moment.</p>
          <Link
            to="/properties"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Parcourir les annonces
          </Link>
        </div>
      )}

      {result && result.data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
