import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authReturnPath } from '../utils/authRedirect'
import { userHasRole } from '../utils/authUser'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (isBootstrapping) {
    return <p className="text-slate-500">Chargement…</p>
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: authReturnPath(location.pathname, location.search, location.hash) }}
      />
    )
  }

  if (!userHasRole(user, 'admin')) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{ message: 'Accès réservé aux administrateurs.' }}
      />
    )
  }

  return children
}
