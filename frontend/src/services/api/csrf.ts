import axios from 'axios'
import { env } from '../../config/env'

/**
 * Initialise le cookie CSRF Sanctum avant toute requête POST/PUT/DELETE authentifiée.
 */
export async function initCsrfCookie(): Promise<void> {
  await axios.get('/sanctum/csrf-cookie', {
    baseURL: env.apiOrigin || '/',
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
}
