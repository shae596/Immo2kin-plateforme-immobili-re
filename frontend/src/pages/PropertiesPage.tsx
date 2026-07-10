import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { PropertyFiltersForm } from '../components/PropertyFiltersForm'
import { fetchAmenities, fetchProperties } from '../services/api/properties'
import type {
  Amenity,
  PaginatedProperties,
  PropertySearchFilters,
} from '../types/property'
import { getApiErrorMessage } from '../utils/apiErrors'
import {
  parseSearchFilters,
  searchFiltersToParams,
} from '../utils/propertySearch'

export function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => parseSearchFilters(searchParams),
    [searchParams],
  )
  const setFilters = useCallback(
    (next: PropertySearchFilters) => {
      setSearchParams(searchFiltersToParams(next), { replace: true })
    },
    [setSearchParams],
  )
  const [result, setResult] = useState<PaginatedProperties | null>(null)
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAmenities().then(setAmenities).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchProperties(filters)
      .then(setResult)
      .catch((err) =>
        setError(getApiErrorMessage(err, 'Impossible de charger les annonces.')),
      )
      .finally(() => setLoading(false))
  }, [filters])

  function handleFavoriteChange(propertyId: number, isFavorited: boolean) {
    setResult((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        data: prev.data.map((p) =>
          p.id === propertyId ? { ...p, is_favorited: isFavorited } : p,
        ),
      }
    })
  }

  const mapQuery = searchParams.toString()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Annonces immobilières</h1>
          <p className="page-subtitle">
            Parcourez les biens disponibles à Kinshasa et ailleurs.
          </p>
        </div>
        <Link
          to={mapQuery ? `/properties/map?${mapQuery}` : '/properties/map'}
          className="btn-primary px-4 py-2"
        >
          Vue carte
        </Link>
      </div>

      <PropertyFiltersForm
        filters={filters}
        amenities={amenities}
        onChange={setFilters}
      />

      {loading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {result && !loading && (
        <p className="text-sm font-medium text-slate-600">
          <span className="font-bold text-brand-700">{result.meta.total}</span> annonce
          {result.meta.total !== 1 ? 's' : ''} trouvée{result.meta.total !== 1 ? 's' : ''}
        </p>
      )}

      {result && result.data.length === 0 && !loading && !error && (
        <p className="text-slate-500">Aucune annonce trouvée.</p>
      )}

      {result && result.data.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>

          {result.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                disabled={result.meta.current_page <= 1}
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: (filters.page ?? 1) - 1,
                  })
                }
                className="btn-secondary px-4 py-2 disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="px-3 py-2 text-sm text-slate-600">
                Page {result.meta.current_page} / {result.meta.last_page}
              </span>
              <button
                type="button"
                disabled={result.meta.current_page >= result.meta.last_page}
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: (filters.page ?? 1) + 1,
                  })
                }
                className="btn-secondary px-4 py-2 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
