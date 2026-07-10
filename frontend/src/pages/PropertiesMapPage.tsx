import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PropertyFiltersForm } from '../components/PropertyFiltersForm'
import { PropertyMap } from '../components/PropertyMap'
import {
  fetchAmenities,
  fetchPropertyMapMarkers,
} from '../services/api/properties'
import type { Amenity, PropertyMapMarker, PropertySearchFilters } from '../types/property'
import { getApiErrorMessage } from '../utils/apiErrors'
import {
  hasActiveSearchFilters,
  parseSearchFilters,
  searchFiltersToParams,
} from '../utils/propertySearch'

const DEFAULT_RADIUS_KM = 10

export function PropertiesMapPage() {
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
  const [markers, setMarkers] = useState<PropertyMapMarker[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchArea = useMemo(() => {
    if (
      filters.lat !== undefined &&
      filters.lng !== undefined &&
      filters.radius_km !== undefined
    ) {
      return {
        lat: filters.lat,
        lng: filters.lng,
        radiusKm: filters.radius_km,
      }
    }
    return null
  }, [filters.lat, filters.lng, filters.radius_km])

  useEffect(() => {
    fetchAmenities().then(setAmenities).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchPropertyMapMarkers(filters)
      .then(setMarkers)
      .catch((err) =>
        setError(getApiErrorMessage(err, 'Impossible de charger la carte.')),
      )
      .finally(() => setLoading(false))
  }, [filters])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setFilters({
        ...filters,
        lat: Math.round(lat * 1_000_000) / 1_000_000,
        lng: Math.round(lng * 1_000_000) / 1_000_000,
        radius_km: filters.radius_km ?? DEFAULT_RADIUS_KM,
        page: 1,
      })
    },
    [filters, setFilters],
  )

  const clearGeoSearch = useCallback(() => {
    const { lat: _lat, lng: _lng, radius_km: _radius, ...rest } = filters
    setFilters({ ...rest, page: 1 })
  }, [filters, setFilters])

  const listQuery = searchParams.toString()
  const activeFilters = hasActiveSearchFilters(filters)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Carte des annonces</h1>
          <p className="page-subtitle">
            Visualisez les biens géolocalisés à Kinshasa. Les filtres sont partagés avec la liste.
          </p>
        </div>
        <Link
          to={listQuery ? `/properties?${listQuery}` : '/properties'}
          className="btn-secondary px-4 py-2"
        >
          Vue liste
        </Link>
      </div>

      <PropertyFiltersForm
        filters={filters}
        amenities={amenities}
        onChange={setFilters}
        showGeo
      />

      {searchArea && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-600">
            Recherche autour du point sélectionné (rayon {searchArea.radiusKm} km)
          </span>
          <button
            type="button"
            onClick={clearGeoSearch}
            className="text-emerald-700 hover:underline"
          >
            Effacer la zone sur la carte
          </button>
        </div>
      )}

      {loading && <p className="text-slate-500">Chargement de la carte…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && markers.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {activeFilters ? (
            <p>
              Aucun bien géolocalisé ne correspond à ces critères. Élargissez les filtres, effacez
              la zone sur la carte, ou cliquez ailleurs sur la carte.
            </p>
          ) : (
            <p>
              Aucune annonce n&apos;a de coordonnées GPS en base. Exécutez{' '}
              <code className="rounded bg-amber-100 px-1">
                php artisan properties:backfill-coordinates
              </code>{' '}
              dans le dossier <code className="rounded bg-amber-100 px-1">backend</code>, puis
              rechargez cette page.
            </p>
          )}
        </div>
      )}

      {!loading && !error && markers.length > 0 && (
        <p className="text-sm text-slate-600">
          {markers.length} annonce{markers.length > 1 ? 's' : ''} sur la carte
        </p>
      )}

      {!error && (
        <PropertyMap
          markers={markers}
          searchArea={searchArea}
          onLocationPick={handleMapClick}
          className="h-[min(70vh,560px)]"
        />
      )}
    </div>
  )
}
