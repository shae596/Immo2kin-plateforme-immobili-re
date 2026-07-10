import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authReturnPath } from '../utils/authRedirect'
import { userCanManageProperties } from '../utils/authUser'

interface OwnerRouteProps {
  children: React.ReactNode
}

export function OwnerRoute({ children }: OwnerRouteProps) {
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

  if (!userCanManageProperties(user)) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          message:
            'Seuls les propriétaires, agences et administrateurs peuvent gérer des annonces.',
        }}
      />
    )
  }

  return children
}
