import type { UserRole } from '../types/auth'

const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Client',
  proprietaire: 'Propriétaire',
  agence: 'Agence',
  admin: 'Administrateur',
}

const ROLE_STYLES: Record<UserRole, string> = {
  client: 'bg-slate-100 text-slate-700',
  proprietaire: 'bg-blue-100 text-blue-800',
  agence: 'bg-violet-100 text-violet-800',
  admin: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300',
}

interface RoleBadgeProps {
  role: UserRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
