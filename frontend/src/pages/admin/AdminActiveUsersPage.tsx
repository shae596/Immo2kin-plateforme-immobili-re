import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { RoleBadge } from '../../components/RoleBadge'
import { fetchActiveSessions } from '../../services/api/admin'
import type { ActiveSession, ActiveSessionsResponse } from '../../types/admin'
import type { UserRole } from '../../types/auth'
import { getApiErrorMessage } from '../../utils/apiErrors'
import { getUserRoles } from '../../utils/authUser'

function formatLastActivity(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

function shortenUserAgent(ua: string | null): string {
  if (!ua) return '—'
  if (ua.length <= 80) return ua
  return `${ua.slice(0, 77)}…`
}

export function AdminActiveUsersPage() {
  const [result, setResult] = useState<ActiveSessionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActiveSessions()
      setResult(data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const body = err.response.data as ActiveSessionsResponse
        if (body.code === 'session_driver_unsupported') {
          setResult(body)
          return
        }
      }
      setError(getApiErrorMessage(err, 'Impossible de charger les sessions actives.'))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sessions = result?.data ?? []
  const driverWarning = result?.code === 'session_driver_unsupported'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs connectés</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tous les rôles (clients, propriétaires, agences, admins) avec une session active.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
        >
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {driverWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Configuration sessions requise</p>
          <p className="mt-1">
            {result?.message ??
              'Définissez SESSION_DRIVER=database dans backend/.env, puis reconnectez-vous.'}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {result && !driverWarning && result.meta?.total !== undefined && (
        <p className="text-sm text-slate-600">
          {result.meta.total} session{result.meta.total > 1 ? 's' : ''} active — fenêtre :{' '}
          {result.meta.session_lifetime_minutes} min
        </p>
      )}

      {loading && !result && <p className="text-slate-500">Chargement…</p>}

      {!loading && sessions.length === 0 && !driverWarning && !error && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Aucun utilisateur connecté pour le moment.
        </p>
      )}

      {sessions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôles</th>
                <th className="px-4 py-3">Dernière activité</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Navigateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((session: ActiveSession) => (
                <tr key={session.session_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {session.user ? (
                      <div>
                        <p className="font-medium text-slate-900">{session.user.name}</p>
                        <p className="text-xs text-slate-500">{session.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Utilisateur #{session.user_id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getUserRoles(session.user).length > 0
                        ? getUserRoles(session.user).map((role) => (
                            <RoleBadge key={role} role={role as UserRole} />
                          ))
                        : '—'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatLastActivity(session.last_activity)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {session.ip_address ?? '—'}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
                    {shortenUserAgent(session.user_agent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
