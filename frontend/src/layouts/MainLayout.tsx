import { Link, NavLink, Outlet } from 'react-router-dom'
import { BuildingIcon } from '../components/icons'
import { env } from '../config/env'
import { useAuthStore } from '../stores/authStore'
import { userCanManageProperties, userHasRole } from '../utils/authUser'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-brand-700'
    : 'rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-brand-700'
}

export function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const canManageProperties = userCanManageProperties(user)
  const isAdmin = userHasRole(user, 'admin')

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-bold text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm transition group-hover:shadow-md">
              <BuildingIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-brand-700">Immo</span>
              <span className="text-slate-800">2Kin</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
            <NavLink to="/" end className={navLinkClass}>
              Accueil
            </NavLink>
            <NavLink to="/properties" className={navLinkClass}>
              Annonces
            </NavLink>
            <NavLink to="/properties/map" className={navLinkClass}>
              Carte
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/favorites" className={navLinkClass}>
                  Favoris
                </NavLink>
                <NavLink to="/reservations" className={navLinkClass}>
                  Réservations
                </NavLink>
                <NavLink to="/messages" className={navLinkClass}>
                  Messages
                </NavLink>
                {canManageProperties && (
                  <>
                    <NavLink to="/my/properties" className={navLinkClass}>
                      Mes annonces
                    </NavLink>
                    <NavLink to="/my/properties/reservations" className={navLinkClass}>
                      Demandes
                    </NavLink>
                    <NavLink to="/my/verification" className={navLinkClass}>
                      Vérification
                    </NavLink>
                  </>
                )}
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      isActive
                        ? 'rounded-lg bg-amber-100 px-3 py-2 font-semibold text-amber-900'
                        : 'rounded-lg px-3 py-2 font-medium text-amber-800 transition hover:bg-amber-50'
                    }
                  >
                    Admin
                  </NavLink>
                )}
                <span className="hidden max-w-[120px] truncate px-2 text-slate-500 lg:inline">
                  {user?.name}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="btn-ghost text-slate-500"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Connexion
                </NavLink>
                <Link to="/register" className="btn-primary ml-1 px-4 py-2">
                  Inscription
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <Outlet />
      </main>
      <footer className="mt-8 border-t border-slate-200/80 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
                <BuildingIcon className="h-4 w-4" />
              </span>
              {env.appName}
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Plateforme immobilière à Kinshasa — location, vente, carte interactive et réservations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">Explorer</p>
              <Link to="/properties" className="block text-slate-500 hover:text-brand-700">
                Annonces
              </Link>
              <Link to="/properties/map" className="block text-slate-500 hover:text-brand-700">
                Carte
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">Compte</p>
              <Link to="/login" className="block text-slate-500 hover:text-brand-700">
                Connexion
              </Link>
              <Link to="/register" className="block text-slate-500 hover:text-brand-700">
                Inscription
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">Localisation</p>
              <p className="text-slate-500">Kinshasa, RDC</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200/80 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {env.appName}. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
