import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api/auth'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLinkValid = useMemo(() => token.length > 0 && email.length > 0, [token, email])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isLinkValid) {
      return
    }

    setMessage(null)
    setFormError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const response = await resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setMessage(response.message)
      setTimeout(() => navigate('/login'), 2500)
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Réinitialisation impossible.'))
      setFieldErrors(getApiFieldErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLinkValid) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-bold text-amber-900">Lien invalide</h1>
        <p className="text-sm text-amber-800">
          Ce lien de réinitialisation est incomplet ou expiré.
        </p>
        <Link to="/forgot-password" className="text-sm font-medium text-emerald-700 underline">
          Demander un nouveau lien
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez un mot de passe pour {email}.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
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
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {fieldErrors.password?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
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
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Enregistrement…' : 'Réinitialiser'}
        </button>
      </form>
    </div>
  )
}
