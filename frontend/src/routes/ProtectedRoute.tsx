import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authReturnPath } from '../utils/authRedirect'

interface ProtectedRouteProps {
  redirectTo?: string
}

/**
 * Garde de route — redirige vers /login si non authentifié.
 * Mémorise la page demandée pour y revenir après connexion.
 */
export function ProtectedRoute({ redirectTo = '/login' }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Chargement…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: authReturnPath(location.pathname, location.search, location.hash) }}
      />
    )
  }

  return <Outlet />
}
