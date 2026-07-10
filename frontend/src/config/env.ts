/**
 * Variables d'environnement Vite (préfixe VITE_).
 * Centralise la config pour éviter les accès dispersés à import.meta.env.
 *
 * En dev, laisser VITE_API_URL vide pour passer par le proxy Vite (/api, /sanctum)
 * — même origine que le SPA, cookies CSRF Sanctum fiables.
 */
function resolveApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined

  if (raw === undefined || raw.trim() === '') {
    if (import.meta.env.DEV) {
      return ''
    }

    return 'http://localhost:8000'
  }

  return raw.replace(/\/$/, '')
}

const apiOrigin = resolveApiOrigin()

export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Immo2Kin',
  /** Origine API vide = requêtes relatives via proxy Vite (recommandé en local). */
  apiOrigin,
  apiBaseUrl: apiOrigin ? `${apiOrigin}/api` : '/api',
  reverb: {
    key: import.meta.env.VITE_REVERB_APP_KEY ?? '',
    host: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    port: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
  },
  stripePublishableKey: (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() || '',
} as const
