import type { AuthUser, UserRole } from '../types/auth'

export function getUserRoles(user: AuthUser | null | undefined): UserRole[] {
  if (!user?.roles) {
    return []
  }
  return Array.isArray(user.roles) ? user.roles : []
}

export function userHasRole(
  user: AuthUser | null | undefined,
  role: UserRole,
): boolean {
  return getUserRoles(user).includes(role)
}

export function userCanManageProperties(user: AuthUser | null | undefined): boolean {
  return getUserRoles(user).some((r) =>
    ['proprietaire', 'agence', 'admin'].includes(r),
  )
}

export function normalizeAuthUser(user: AuthUser | null): AuthUser | null {
  if (!user) {
    return null
  }

  return {
    ...user,
    roles: getUserRoles(user),
  }
}
