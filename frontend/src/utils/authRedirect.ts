/**
 * Chemin complet (pathname + search + hash) pour revenir après connexion.
 */
export function authReturnPath(pathname: string, search = '', hash = ''): string {
  return `${pathname}${search}${hash}`
}

/**
 * Valide une URL interne de retour après connexion.
 */
export function sanitizeAuthRedirect(path: string | undefined, fallback = '/'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return fallback
  }
  if (path === '/login' || path === '/register') {
    return fallback
  }
  return path
}
