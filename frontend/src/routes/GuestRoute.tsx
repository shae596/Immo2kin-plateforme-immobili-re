import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { sanitizeAuthRedirect } from '../utils/authRedirect'

interface GuestRouteProps {
  redirectTo?: string
}

/** Redirige les utilisateurs déjà connectés hors des pages auth. */
export function GuestRoute({ redirectTo = '/' }: GuestRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  if (!isBootstrapping && isAuthenticated) {
    const target = sanitizeAuthRedirect(from, redirectTo)
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
