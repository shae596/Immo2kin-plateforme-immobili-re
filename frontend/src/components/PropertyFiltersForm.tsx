import { useState } from 'react'
import type { Amenity, PropertySearchFilters } from '../types/property'
import {
  LISTING_TYPES,
  PROPERTY_SORT_OPTIONS,
  PROPERTY_TYPES,
} from '../types/property'

interface PropertyFiltersFormProps {
  filters: PropertySearchFilters
  amenities: Amenity[]
  onChange: (filters: PropertySearchFilters) => void
  showGeo?: boolean
}

export function PropertyFiltersForm({
  filters,
  amenities,
  onChange,
  showGeo = false,
}: PropertyFiltersFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  function patch(partial: Partial<PropertySearchFilters>) {
    onChange({ ...filters, ...partial, page: 1 })
  }

  function toggleAmenity(id: number) {
    const current = filters.amenity_ids ?? []
    const next = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id]
    patch({ amenity_ids: next.length > 0 ? next : undefined })
  }

  function clearFilters() {
    onChange({ page: 1 })
  }

  return (
    <div className="card-surface space-y-5 p-5 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="filter-q" className="mb-1 block text-xs font-medium text-slate-600">
            Recherche
          </label>
          <input
            id="filter-q"
            placeholder="Titre, description, adresse…"
            value={filters.q ?? ''}
            onChange={(e) => patch({ q: e.target.value || undefined })}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="filter-city" className="mb-1 block text-xs font-medium text-slate-600">
            Ville
          </label>
          <input
            id="filter-city"
            placeholder="Kinshasa"
            value={filters.city ?? ''}
            onChange={(e) => patch({ city: e.target.value || undefined })}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="filter-commune" className="mb-1 block text-xs font-medium text-slate-600">
            Commune
          </label>
          <input
            id="filter-commune"
            placeholder="Gombe"
            value={filters.commune ?? ''}
            onChange={(e) => patch({ commune: e.target.value || undefined })}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="filter-type" className="mb-1 block text-xs font-medium text-slate-600">
            Type de bien
          </label>
          <select
            id="filter-type"
            value={filters.type ?? ''}
            onChange={(e) =>
              patch({ type: (e.target.value || undefined) as PropertySearchFilters['type'] })
            }
            className="input-field"
          >
            <option value="">Tous</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-listing" className="mb-1 block text-xs font-medium text-slate-600">
            Offre
          </label>
          <select
            id="filter-listing"
            value={filters.listing_type ?? ''}
            onChange={(e) =>
              patch({
                listing_type: (e.target.value || undefined) as PropertySearchFilters['listing_type'],
              })
            }
            className="input-field"
          >
            <option value="">Location & vente</option>
            {LISTING_TYPES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-slate-600">
            Tri
          </label>
          <select
            id="filter-sort"
            value={filters.sort ?? 'newest'}
            onChange={(e) =>
              patch({
                sort: (e.target.value || undefined) as PropertySearchFilters['sort'],
              })
            }
            className="input-field"
          >
            {PROPERTY_SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-min-price" className="mb-1 block text-xs font-medium text-slate-600">
            Prix min (USD)
          </label>
          <input
            id="filter-min-price"
            type="number"
            min={0}
            value={filters.min_price ?? ''}
            onChange={(e) =>
              patch({
                min_price: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="filter-max-price" className="mb-1 block text-xs font-medium text-slate-600">
            Prix max (USD)
          </label>
          <input
            id="filter-max-price"
            type="number"
            min={0}
            value={filters.max_price ?? ''}
            onChange={(e) =>
              patch({
                max_price: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="input-field"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        {advancedOpen ? 'Masquer les filtres avancés' : 'Filtres avancés'}
      </button>

      {advancedOpen && (
        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="filter-min-rooms" className="mb-1 block text-xs font-medium text-slate-600">
              Chambres min.
            </label>
            <input
              id="filter-min-rooms"
              type="number"
              min={0}
              value={filters.min_rooms ?? ''}
              onChange={(e) =>
                patch({
                  min_rooms: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="filter-min-area" className="mb-1 block text-xs font-medium text-slate-600">
              Surface min. (m²)
            </label>
            <input
              id="filter-min-area"
              type="number"
              min={0}
              value={filters.min_area ?? ''}
              onChange={(e) =>
                patch({
                  min_area: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="input-field"
            />
          </div>

          <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.has_kitchen ?? false}
                onChange={(e) =>
                  patch({ has_kitchen: e.target.checked || undefined })
                }
              />
              Cuisine
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.has_living_room ?? false}
                onChange={(e) =>
                  patch({ has_living_room: e.target.checked || undefined })
                }
              />
              Salon
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.has_store ?? false}
                onChange={(e) =>
                  patch({ has_store: e.target.checked || undefined })
                }
              />
              Débarras
            </label>
          </div>

          {amenities.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-xs font-medium text-slate-600">Équipements</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => {
                  const selected = filters.amenity_ids?.includes(amenity.id) ?? false
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-400 hover:bg-white'
                      }`}
                    >
                      {amenity.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {showGeo && (
            <>
              <div>
                <label htmlFor="filter-lat" className="mb-1 block text-xs font-medium text-slate-600">
                  Latitude
                </label>
                <input
                  id="filter-lat"
                  type="number"
                  step="any"
                  value={filters.lat ?? ''}
                  onChange={(e) =>
                    patch({ lat: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="filter-lng" className="mb-1 block text-xs font-medium text-slate-600">
                  Longitude
                </label>
                <input
                  id="filter-lng"
                  type="number"
                  step="any"
                  value={filters.lng ?? ''}
                  onChange={(e) =>
                    patch({ lng: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="filter-radius" className="mb-1 block text-xs font-medium text-slate-600">
                  Rayon (km)
                </label>
                <input
                  id="filter-radius"
                  type="number"
                  min={0.1}
                  step={0.5}
                  placeholder="5"
                  value={filters.radius_km ?? ''}
                  onChange={(e) =>
                    patch({
                      radius_km: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-slate-600 hover:text-emerald-700"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  )
}
