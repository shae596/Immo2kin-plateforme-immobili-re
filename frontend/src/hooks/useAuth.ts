import { useAuthStore } from '../stores/authStore'

/** Hook pratique pour consommer le store auth dans les composants. */
export function useAuth() {
  return useAuthStore()
}
