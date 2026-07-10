import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { verifyEmail } from '../services/api/auth'
import { getApiErrorMessage } from '../utils/apiErrors'

export function VerifyEmailPage() {
  const { id, hash } = useParams<{ id: string; hash: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { isAuthenticated, bootstrap } = useAuth()

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const verifyPath = `${location.pathname}${location.search}`

  useEffect(() => {
    if (!isAuthenticated || !id || !hash) {
      return
    }

    const query = searchParams.toString()
    if (!query) {
      setStatus('error')
      setMessage('Lien de vérification incomplet.')
      return
    }

    setStatus('loading')

    verifyEmail(id, hash, query)
      .then(async (response) => {
        await bootstrap()
        setStatus('success')
        setMessage(response.message)
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(getApiErrorMessage(error, 'Vérification impossible.'))
      })
  }, [isAuthenticated, id, hash, searchParams, bootstrap])

  if (!id || !hash) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm text-amber-900">Lien de vérification invalide.</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Vérification e-mail</h1>
        <p className="text-sm text-slate-600">
          Connectez-vous pour confirmer votre adresse e-mail.
        </p>
        <Link
          to="/login"
          state={{ from: verifyPath }}
          className="inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Vérification e-mail</h1>

      {status === 'loading' && (
        <p className="text-sm text-slate-600">Vérification en cours…</p>
      )}

      {status === 'success' && message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {status === 'error' && message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
      )}

      {status === 'idle' && (
        <p className="text-sm text-slate-600">Préparation de la vérification…</p>
      )}

      {status === 'success' && (
        <Link to="/dashboard" className="text-sm font-medium text-emerald-700 underline">
          Aller au dashboard
        </Link>
      )}
    </div>
  )
}
