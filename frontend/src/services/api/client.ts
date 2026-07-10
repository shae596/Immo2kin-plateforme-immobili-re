import axios from 'axios'
import { env } from '../../config/env'

/**
 * Client HTTP Axios configuré pour Sanctum SPA :
 * - cookies de session (withCredentials)
 * - en-tête X-Requested-With attendu par Laravel
 * - jeton CSRF lu depuis le cookie XSRF-TOKEN (même origine via proxy Vite en dev)
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)
