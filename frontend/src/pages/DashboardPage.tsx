import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RoleBadge } from '../components/RoleBadge'
import type { UserRole } from '../types/auth'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors'
import { getUserRoles, userCanManageProperties, userHasRole } from '../utils/authUser'

export function DashboardPage() {
  const location = useLocation()
  const { user, updateProfile, resendVerification, logout } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [commune, setCommune] = useState(user?.commune ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const redirectMessage = (location.state as { message?: string } | null)?.message

  useEffect(() => {
    if (redirectMessage) {
      setMessage(redirectMessage)
    }
  }, [redirectMessage])

  useEffect(() => {
    if (!user) {
      return
    }
    setName(user.name)
    setPhone(user.phone ?? '')
    setBio(user.bio ?? '')
    setCity(user.city ?? '')
    setCommune(user.commune ?? '')
  }, [user])

  if (!user) {
    return null
  }

  const roles = getUserRoles(user)
  const isVerified = Boolean(user.email_verified_at)
  const isAdmin = userHasRole(user, 'admin')
  const canManage = userCanManageProperties(user)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setFormError(null)
    setFieldErrors({})

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        commune: commune.trim() || null,
      })
      setMessage('Profil mis à jour.')
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Mise à jour impossible.'))
      setFieldErrors(getApiFieldErrors(error))
    }
  }

  async function handleResendVerification() {
    try {
      const msg = await resendVerification()
      setMessage(msg)
    } catch {
      setFormError('Impossible de renvoyer l\'e-mail de vérification.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon espace</h1>
          <p className="mt-1 text-slate-600">
            Bienvenue, {user.name}.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {roles.map((role) => (
              <RoleBadge key={role} role={role as UserRole} />
            ))}
          </div>
          {isAdmin && (
            <div className="mt-3">
              <Link
                to="/admin"
                className="inline-block rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-200"
              >
                Ouvrir le back-office administrateur →
              </Link>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/reservations"
              className="inline-block rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Mes réservations
            </Link>
            <Link
              to="/favorites"
              className="inline-block rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Mes favoris
            </Link>
            {canManage && (
              <>
                <Link
                  to="/my/properties"
                  className="inline-block rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Mes annonces
                </Link>
                <Link
                  to="/my/properties/reservations"
                  className="inline-block rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Demandes reçues
                </Link>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Déconnexion
        </button>
      </div>

      {!isVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            Votre e-mail n&apos;est pas encore vérifié ({user.email}).
          </p>
          <button
            type="button"
            onClick={() => void handleResendVerification()}
            className="mt-2 text-sm font-medium text-amber-900 underline"
          >
            Renvoyer l&apos;e-mail de vérification
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Profil</h2>

        {message && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {formError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="profile-name" className="mb-1 block text-sm font-medium">
            Nom
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {fieldErrors.name?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="profile-phone" className="mb-1 block text-sm font-medium">
            Téléphone
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0892905498"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {canManage && (
            <p className="mt-1 text-xs text-slate-500">
              Ce numéro s&apos;affiche sur vos annonces pour WhatsApp et les appels.
              Pensez à cliquer sur « Enregistrer » après modification.
            </p>
          )}
          {fieldErrors.phone?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-city" className="mb-1 block text-sm font-medium">
              Ville
            </label>
            <input
              id="profile-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="profile-commune" className="mb-1 block text-sm font-medium">
              Commune
            </label>
            <input
              id="profile-commune"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="mb-1 block text-sm font-medium">
            Bio
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Enregistrer
        </button>
      </form>
    </div>
  )
}
