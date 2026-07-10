import { Link } from 'react-router-dom'
import type { Property } from '../types/property'
import { formatPrice, listingTypeLabel, propertyTypeLabel } from '../types/property'
import { FavoriteButton } from './FavoriteButton'
import { StarRating } from './StarRating'

interface PropertyCardProps {
  property: Property
  showFavorite?: boolean
  onFavoriteChange?: (propertyId: number, isFavorited: boolean) => void
}

export function PropertyCard({
  property,
  showFavorite = true,
  onFavoriteChange,
}: PropertyCardProps) {
  const cover = property.images?.[0]?.url

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
      <Link to={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {cover ? (
            <img
              src={cover}
              alt={property.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <svg className="h-10 w-10 opacity-40" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 21V9l8-5 8 5v12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm">Aucune photo</span>
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="badge-brand shadow-sm backdrop-blur-sm">
              {listingTypeLabel(property.listing_type)}
            </span>
            {showFavorite && (
              <FavoriteButton
                propertyId={property.id}
                isFavorited={property.is_favorited}
                onChange={onFavoriteChange}
              />
            )}
          </div>
          {property.is_verified && (
            <span className="absolute bottom-3 left-3 badge bg-white/95 text-brand-800 shadow-sm ring-1 ring-brand-100">
              ✓ Vérifié
            </span>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-bold leading-snug text-slate-900 transition group-hover:text-brand-700">
              {property.title}
            </h3>
            <span className="shrink-0 text-base font-extrabold text-brand-700">
              {formatPrice(property.price, property.currency)}
            </span>
          </div>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {property.commune}, {property.city}
          </p>
          {property.reviews_summary &&
            property.reviews_summary.count > 0 &&
            property.reviews_summary.average !== null && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <StarRating rating={property.reviews_summary.average} size="sm" />
                <span className="font-medium">
                  {property.reviews_summary.average.toFixed(1)}
                </span>
                <span className="text-slate-400">
                  ({property.reviews_summary.count} avis)
                </span>
              </div>
            )}
          <div className="flex flex-wrap gap-1.5">
            <span className="badge-muted">{propertyTypeLabel(property.type)}</span>
            {property.rooms != null && (
              <span className="badge-muted">{property.rooms} ch.</span>
            )}
            {property.area != null && (
              <span className="badge-muted">{property.area} m²</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
