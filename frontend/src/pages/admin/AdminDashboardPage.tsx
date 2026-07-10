import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminStats } from '../../services/api/admin'
import type { AdminStats } from '../../types/admin'
import { getApiErrorMessage } from '../../utils/apiErrors'
import { formatPrice } from '../../types/property'

function StatCard({
  label,
  value,
  hint,
  to,
}: {
  label: string
  value: string | number
  hint?: string
  to?: string
}) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block transition hover:ring-2 hover:ring-emerald-200 rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err) => setError(getApiErrorMessage(err, 'Statistiques indisponibles.')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-500">Chargement…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!stats) return null

  const roleSummary = Object.entries(stats.users.by_role)
    .map(([role, count]) => `${role}: ${count}`)
    .join(' · ')

  const reservationSummary = Object.entries(stats.reservations.by_status)
    .map(([status, count]) => `${status}: ${count}`)
    .join(' · ')

  const paymentMethods = Object.entries(stats.payments.by_method)
    .map(([method, data]) => `${method}: ${data.count} (${formatPrice(data.amount, 'USD')})`)
    .join(' · ')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-600">Vue d&apos;ensemble de la plateforme.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Utilisateurs"
          value={stats.users.total}
          hint={roleSummary}
          to="/admin/users"
        />
        <StatCard
          label="Annonces"
          value={stats.properties.total}
          hint={`${stats.properties.published} publiées · ${stats.properties.draft} brouillons`}
          to="/admin/properties"
        />
        <StatCard
          label="Réservations"
          value={stats.reservations.total}
          hint={`${reservationSummary} · ${stats.reservations.paid} payées`}
          to="/admin/reservations"
        />
        <StatCard
          label="Paiements réussis"
          value={stats.payments.paid}
          hint={`Total encaissé : ${formatPrice(stats.payments.paid_amount, 'USD')}`}
          to="/admin/payments"
        />
        <StatCard
          label="Sessions actives"
          value={stats.active_sessions}
          hint="Utilisateurs connectés (fenêtre session Laravel)"
          to="/admin/active-users"
        />
        <StatCard
          label="Paiements (volume)"
          value={stats.payments.total}
          hint={paymentMethods || 'Aucun paiement enregistré'}
          to="/admin/payments"
        />
      </div>
    </div>
  )
}
