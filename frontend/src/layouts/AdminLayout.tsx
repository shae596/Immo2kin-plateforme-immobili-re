import { NavLink, Outlet, Link } from 'react-router-dom'
import { env } from '../config/env'

const navItems = [
  { to: '/admin', end: true, label: 'Tableau de bord' },
  { to: '/admin/users', label: 'Utilisateurs' },
  { to: '/admin/properties', label: 'Annonces' },
  { to: '/admin/reservations', label: 'Réservations' },
  { to: '/admin/payments', label: 'Paiements' },
  { to: '/admin/active-users', label: 'Connectés' },
  { to: '/admin/verifications', label: 'Vérifications' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <Link to="/" className="text-lg font-semibold text-emerald-700">
              {env.appName}
            </Link>
            <p className="text-xs text-amber-800">Back-office administrateur</p>
          </div>
          <Link
            to="/dashboard"
            className="text-sm text-slate-600 hover:text-emerald-700"
          >
            ← Mon espace
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="w-52 shrink-0">
          <nav className="space-y-1 rounded-lg border border-slate-200 bg-white p-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 ${
                    isActive
                      ? 'bg-emerald-700 font-medium text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
