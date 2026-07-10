import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FavoriteButton } from '../components/FavoriteButton'
import { OwnerContactCard } from '../components/OwnerContactCard'
import { PropertyMessageForm } from '../components/PropertyMessageForm'
import { PropertyReviewsSection } from '../components/PropertyReviewsSection'
import { SimilarProperties } from '../components/SimilarProperties'
import { ReservationForm } from '../components/ReservationForm'
import { StarRating } from '../components/StarRating'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { useAuth } from '../hooks/useAuth'
import { deleteProperty, fetchProperty } from '../services/api/properties'
import type { Property } from '../types/property'
import {
  formatPrice,
  listingTypeLabel,
  propertyStatusLabel,
  propertyTypeLabel,
  showsRoomComposition,
  yesNo,
} from '../types/property'
import { userHasRole } from '../utils/authUser'

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const propertyId = Number(id)
  const isOwner = user?.id === property?.owner?.id
  const canManage =
    isOwner || userHasRole(user, 'admin')
  const isAuthenticated = Boolean(user)

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    fetchProperty(propertyId)
      .then(setProperty)
      .catch(() => setError('Annonce introuvable.'))
      .finally(() => setLoading(false))
  }, [propertyId])

  async function confirmDelete() {
    if (!property) return
    setDeleting(true)
    try {
      await deleteProperty(property.id)
      navigate('/my/properties')
    } catch {
      setError('Suppression impossible.')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-slate-500">Chargement…</p>
  if (error || !property) return <p className="text-red-600">{error ?? 'Erreur.'}</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/properties" className="text-sm text-emerald-700 hover:underline">
            ← Retour aux annonces
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{property.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-slate-600">
              {property.commune}, {property.city}
            </p>
            {property.is_verified && <VerifiedBadge />}
          </div>
          {property.reviews_summary && property.reviews_summary.count > 0 && property.reviews_summary.average !== null && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <StarRating rating={property.reviews_summary.average} size="sm" />
              <span>
                {property.reviews_summary.average.toFixed(1)} ({property.reviews_summary.count} avis)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xl font-semibold text-emerald-700">
              {formatPrice(property.price, property.currency)}
            </span>
            <p className="text-xs text-slate-500">
              {listingTypeLabel(property.listing_type)}
            </p>
          </div>
          <FavoriteButton
            propertyId={property.id}
            isFavorited={property.is_favorited}
            onChange={(_, fav) => setProperty({ ...property, is_favorited: fav })}
          />
        </div>
      </div>

      {property.images && property.images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {property.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex aspect-[16/6] items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          Aucune photo
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">
              {property.description ?? 'Aucune description.'}
            </p>
          </section>

          {property.amenities && property.amenities.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold">Équipements</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800"
                  >
                    {a.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {property.status === 'published' && <ReservationForm property={property} />}

          <PropertyReviewsSection
            propertyId={property.id}
            initialSummary={property.reviews_summary}
          />

          <SimilarProperties propertyId={property.id} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Caractéristiques</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Type</dt>
                <dd>{propertyTypeLabel(property.type)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Transaction</dt>
                <dd>{listingTypeLabel(property.listing_type)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Statut annonce</dt>
                <dd>{propertyStatusLabel(property.status)}</dd>
              </div>
              {showsRoomComposition(property.type) && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Salon / séjour</dt>
                    <dd>{yesNo(property.has_living_room)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Cuisine</dt>
                    <dd>{yesNo(property.has_kitchen)}</dd>
                  </div>
                  {property.has_store && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Débarras</dt>
                      <dd>{yesNo(property.has_store)}</dd>
                    </div>
                  )}
                </>
              )}
              {!showsRoomComposition(property.type) && property.has_store && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Débarras / réserve</dt>
                  <dd>{yesNo(property.has_store)}</dd>
                </div>
              )}
              {property.rooms != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Chambres</dt>
                  <dd>{property.rooms}</dd>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Salles de bain</dt>
                  <dd>{property.bathrooms}</dd>
                </div>
              )}
              {property.area != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Surface</dt>
                  <dd>{property.area} m²</dd>
                </div>
              )}
            </dl>
          </div>

          {!isOwner && <OwnerContactCard property={property} />}

          {!isOwner && isAuthenticated && (
            <PropertyMessageForm propertyId={property.id} propertyTitle={property.title} />
          )}

          {canManage && (
            <div className="flex flex-col gap-2">
              <Link
                to={`/my/properties/${property.id}/edit`}
                className="rounded-md bg-emerald-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-800"
              >
                Modifier
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Supprimer l'annonce"
        message={
          property ? (
            <>
              Voulez-vous supprimer définitivement{' '}
              <span className="font-semibold text-slate-900">{property.title}</span> ? Cette action
              est irréversible.
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        variant="danger"
        busy={deleting}
        busyLabel="Suppression…"
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setShowDeleteConfirm(false)
        }}
      />
    </div>
  )
}
