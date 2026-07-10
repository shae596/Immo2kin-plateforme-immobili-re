import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import axios from 'axios'
import { env } from '../config/env'
import { initCsrfCookie } from '../services/api/csrf'

/**
 * Client Laravel Echo + Reverb (WebSockets).
 * Auth Sanctum via /broadcasting/auth (hors préfixe /api).
 */
window.Pusher = Pusher

const broadcastClient = axios.create({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export const echo = new Echo({
  broadcaster: 'reverb',
  key: env.reverb.key,
  wsHost: env.reverb.host,
  wsPort: env.reverb.port,
  wssPort: env.reverb.port,
  forceTLS: env.reverb.scheme === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      void initCsrfCookie()
        .then(() =>
          broadcastClient.post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          }),
        )
        .then((response) => callback(null, response.data))
        .catch((error) => callback(error instanceof Error ? error : new Error(String(error)), null))
    },
  }),
})

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}
