import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors'
import { sanitizeAuthRedirect } from '../utils/authRedirect'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isAuthPending = useAuthStore((state) => state.isAuthPending)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const redirectTo = sanitizeAuthRedirect(
    (location.state as { from?: string } | null)?.from,
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    try {
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Connexion impossible.'))
      setFieldErrors(getApiFieldErrors(error))
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="page-title">Connexion</h1>
        <p className="page-subtitle mx-auto">
          Accédez à votre espace immobilier.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card-surface space-y-4 p-6 md:p-8"
      >
        {formError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

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
            className="input-field"
          />
          {fieldErrors?.email?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              Mot de passe
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={isAuthPending}
          className="btn-primary w-full disabled:opacity-60"
        >
          {isAuthPending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Pas encore de compte ?{' '}
        <Link
          to="/register"
          state={{ from: redirectTo }}
          className="font-medium text-emerald-700 hover:underline"
        >
          S&apos;inscrire
        </Link>
      </p>
    </div>
  )
}
