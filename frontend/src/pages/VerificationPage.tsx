import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { useAuth } from '../hooks/useAuth'
import { fetchMyProperties } from '../services/api/properties'
import { fetchMyVerifications, submitVerification } from '../services/api/verifications'
import type { Property } from '../types/property'
import type { Verification } from '../types/verification'
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_TYPE_LABELS,
} from '../types/verification'
import { getApiErrorMessage } from '../utils/apiErrors'
import { userCanManageProperties } from '../utils/authUser'

export function VerificationPage() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyNotes, setPropertyNotes] = useState('')
  const [propertyId, setPropertyId] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  const canManage = userCanManageProperties(user)

  function load() {
    setLoading(true)
    Promise.all([
      fetchMyVerifications(),
      canManage ? fetchMyProperties({ per_page: 50 }) : Promise.resolve(null),
    ])
      .then(([verifResult, propsResult]) => {
        setVerifications(verifResult.data)
        if (propsResult) {
          setProperties(propsResult.data.filter((p) => !p.is_verified))
        }
      })
      .catch(() => setError('Chargement impossible.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [canManage])

  async function handlePropertySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!propertyId) return
    setSubmitting(true)
    setError(null)
    try {
      await submitVerification({
        property_id: Number(propertyId),
        notes: propertyNotes || undefined,
      })
      setPropertyNotes('')
      setPropertyId('')
      load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Demande impossible.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!canManage) {
    return (
      <p className="text-slate-600">
        La vérification est réservée aux propriétaires et agences.{' '}
        <Link to="/dashboard" className="text-emerald-700 hover:underline">
          Retour au dashboard
        </Link>
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vérification des annonces</h1>
        <p className="mt-1 text-sm text-slate-600">
          Demandez la validation de la légitimité de vos annonces (titre foncier, photos du bien…).
          Le badge <VerifiedBadge className="align-middle" /> s&apos;affichera sur l&apos;annonce approuvée.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : (
        <>
          {verifications.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold">Mes demandes</h2>
              <ul className="mt-4 space-y-3">
                {verifications.map((v) => (
                  <li key={v.id} className="rounded-md border border-slate-100 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{VERIFICATION_TYPE_LABELS[v.type]}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          v.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {VERIFICATION_STATUS_LABELS[v.status]}
                      </span>
                    </div>
                    {v.property && (
                      <p className="mt-1 text-slate-600">Annonce : {v.property.title}</p>
                    )}
                    {v.notes && <p className="mt-1 text-slate-500">{v.notes}</p>}
                    {v.admin_notes && (
                      <p className="mt-1 text-xs text-slate-400">Admin : {v.admin_notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {properties.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold">Vérifier une annonce</h2>
              <p className="mt-1 text-sm text-slate-600">
                Indiquez les pièces justificatives que vous fournirez (titre foncier, contrat, photos…).
              </p>
              <form onSubmit={(e) => void handlePropertySubmit(e)} className="mt-4 space-y-3">
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Choisir une annonce</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <textarea
                  value={propertyNotes}
                  onChange={(e) => setPropertyNotes(e.target.value)}
                  rows={3}
                  placeholder="Détails sur les pièces justificatives"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submitting ? 'Envoi…' : 'Demander la vérification'}
                </button>
              </form>
            </section>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Toutes vos annonces publiées sont déjà vérifiées, ou aucune annonce n&apos;est éligible pour le moment.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
