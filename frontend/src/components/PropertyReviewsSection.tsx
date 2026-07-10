import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ConfirmDialog } from './ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import {
  createPropertyReview,
  deleteReview,
  fetchPropertyReviews,
  updateReview,
} from '../services/api/reviews'
import type { Review } from '../types/review'
import { authReturnPath } from '../utils/authRedirect'
import { getApiErrorMessage } from '../utils/apiErrors'
import { StarRating } from './StarRating'

interface PropertyReviewsSectionProps {
  propertyId: number
  initialSummary?: { average: number | null; count: number }
}

export function PropertyReviewsSection({
  propertyId,
  initialSummary,
}: PropertyReviewsSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState(initialSummary ?? { average: null, count: 0 })
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetchPropertyReviews(propertyId)
      .then((result) => {
        setReviews(result.data)
        setSummary(result.meta.summary)
        setCanReview(result.meta.can_review)
      })
      .catch(() => setError('Impossible de charger les avis.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [propertyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createPropertyReview(propertyId, { rating, comment: comment || undefined })
      setComment('')
      setRating(5)
      load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Envoi impossible.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(reviewId: number) {
    setSubmitting(true)
    setError(null)
    try {
      await updateReview(reviewId, {
        rating: editRating,
        comment: editComment || undefined,
      })
      setEditingId(null)
      load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Mise à jour impossible.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDeleteReview() {
    if (reviewToDelete === null) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteReview(reviewToDelete)
      setReviewToDelete(null)
      load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Suppression impossible.'))
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(review: Review) {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment ?? '')
  }

  const ownReview = user ? reviews.find((r) => r.user_id === user.id) : undefined

  return (
    <>
    <section id="avis" className="rounded-lg border border-slate-200 bg-white p-6 scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Avis des locataires</h2>
        {summary.count > 0 && summary.average !== null && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <StarRating rating={summary.average} size="sm" />
            <span>
              {summary.average.toFixed(1)} · {summary.count} avis
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Chargement des avis…</p>
      ) : (
        <>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucun avis pour le moment.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((review) => {
                const isOwn = user?.id === review.user_id
                const isEditing = editingId === review.id

                return (
                  <li
                    key={review.id}
                    className="border-t border-slate-100 pt-4 first:border-0 first:pt-0"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <StarRating rating={editRating} interactive onChange={setEditRating} />
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleUpdate(review.id)}
                            className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800">
                              {review.user?.name ?? 'Utilisateur'}
                              {isOwn && (
                                <span className="ml-2 text-xs font-normal text-slate-500">
                                  (vous)
                                </span>
                              )}
                            </p>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          <time className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </time>
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                        )}
                        {isOwn && (
                          <div className="mt-2 flex gap-3 text-sm">
                            <button
                              type="button"
                              onClick={() => startEdit(review)}
                              className="text-emerald-700 hover:underline"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewToDelete(review.id)}
                              className="text-red-600 hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {canReview && !ownReview && (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-medium text-slate-800">Laisser un avis</h3>
              <p className="mt-1 text-xs text-slate-500">
                Réservé aux clients ayant terminé un séjour confirmé sur cette annonce.
              </p>
              <div className="mt-3">
                <StarRating rating={rating} interactive onChange={setRating} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Partagez votre expérience (optionnel)"
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-3 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? 'Envoi…' : 'Publier l\'avis'}
              </button>
            </form>
          )}

          {!canReview && isAuthenticated && !ownReview && (
            <p className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
              Pour laisser un avis, vous devez avoir terminé un séjour confirmé sur cette annonce.
              Consultez{' '}
              <Link to="/reservations" className="text-emerald-700 hover:underline">
                vos réservations
              </Link>
              .
            </p>
          )}

          {!isAuthenticated && (
            <p className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              <Link
                to="/login"
                state={{
                  from: authReturnPath(location.pathname, location.search, '#avis'),
                }}
                className="font-medium text-emerald-700 hover:underline"
              >
                Connectez-vous
              </Link>{' '}
              pour consulter vos éligibilités et publier un avis après un séjour.
            </p>
          )}

          {error && !canReview && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}
    </section>

    <ConfirmDialog
      open={reviewToDelete !== null}
      title="Supprimer votre avis"
      message="Voulez-vous supprimer votre avis ? Cette action est irréversible."
      confirmLabel="Supprimer"
      variant="danger"
      busy={submitting}
      busyLabel="Suppression…"
      onConfirm={() => void confirmDeleteReview()}
      onCancel={() => {
        if (!submitting) setReviewToDelete(null)
      }}
    />
  </>
  )
}
