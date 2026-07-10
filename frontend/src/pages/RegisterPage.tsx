import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { env } from '../config/env'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types/auth'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors'
import { sanitizeAuthRedirect } from '../utils/authRedirect'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'client', label: 'Client (locataire / acheteur)' },
  { value: 'proprietaire', label: 'Propriétaire' },
  { value: 'agence', label: 'Agence immobilière' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const register = useAuthStore((state) => state.register)
  const isAuthPending = useAuthStore((state) => state.isAuthPending)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const redirectTo = sanitizeAuthRedirect(
    (location.state as { from?: string } | null)?.from,
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSuccess(null)

    try {
      await register({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirmation,
        role,
      })
      setSuccess('Compte créé. Vérifiez votre e-mail, puis connectez-vous.')
      setTimeout(
        () => navigate('/login', { replace: true, state: { from: redirectTo } }),
        2500,
      )
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Inscription impossible.'))
      setFieldErrors(getApiFieldErrors(error))
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inscription</h1>
        <p className="mt-1 text-sm text-slate-600">
          Créez votre compte sur {env.appName}.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        {success && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        )}
        {formError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Nom complet
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {fieldErrors?.name?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {fieldErrors?.email?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Téléphone (optionnel)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium">Type de compte</legend>
          <div className="grid gap-2">
            {ROLES.map((item) => (
              <label
                key={item.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  role === item.value
                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.value}
                  checked={role === item.value}
                  onChange={() => setRole(item.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{item.label}</span>
                  {item.value === 'client' && (
                    <span className="text-xs text-slate-500">
                      Réserver, favoris, payer une location.
                    </span>
                  )}
                  {item.value === 'proprietaire' && (
                    <span className="text-xs text-slate-500">
                      Publier vos biens et gérer les demandes.
                    </span>
                  )}
                  {item.value === 'agence' && (
                    <span className="text-xs text-slate-500">
                      Gérer plusieurs annonces comme une agence.
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {fieldErrors?.role?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.role[0]}</p>
          )}
        </fieldset>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {fieldErrors?.password?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Minimum 8 caractères.</p>
        </div>

        <div>
          <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium">
            Confirmer le mot de passe
          </label>
          <input
            id="password_confirmation"
            type="password"
            required
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {fieldErrors?.password_confirmation?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password_confirmation[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isAuthPending}
          className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isAuthPending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Déjà inscrit ?{' '}
        <Link
          to="/login"
          state={{ from: redirectTo }}
          className="font-medium text-emerald-700 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  )
}
