import { create } from 'zustand'
import type { AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../types/auth'
import * as authApi from '../services/api/auth'
import { normalizeAuthUser } from '../utils/authUser'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  isAuthPending: boolean
  error: string | null
  setUser: (user: AuthUser | null) => void
  bootstrap: () => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>
  resendVerification: () => Promise<string>
}

function extractErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message
  }

  return 'Une erreur est survenue.'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  isAuthPending: false,
  error: null,

  setUser: (user) => {
    const normalized = normalizeAuthUser(user)
    set({
      user: normalized,
      isAuthenticated: normalized !== null,
    })
  },

  bootstrap: async () => {
    set({ isBootstrapping: true, error: null })
    try {
      const user = normalizeAuthUser(await authApi.fetchCurrentUser())
      set({ user, isAuthenticated: user !== null })
    } catch {
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isBootstrapping: false })
    }
  },

  login: async (payload) => {
    set({ isAuthPending: true, error: null })
    try {
      const { user } = await authApi.login(payload)
      const normalized = normalizeAuthUser(user)
      set({
        user: normalized,
        isAuthenticated: normalized !== null,
        isAuthPending: false,
      })
      if (normalized === null) {
        throw new Error('Réponse de connexion invalide.')
      }
    } catch (error) {
      set({ isAuthPending: false, error: extractErrorMessage(error) })
      throw error
    }
  },

  register: async (payload) => {
    set({ isAuthPending: true, error: null })
    try {
      await authApi.register(payload)
      set({ isAuthPending: false })
    } catch (error) {
      set({ isAuthPending: false, error: extractErrorMessage(error) })
      throw error
    }
  },

  logout: async () => {
    set({ isAuthPending: true })
    try {
      await authApi.logout()
    } finally {
      set({ user: null, isAuthenticated: false, isAuthPending: false, error: null })
    }
  },

  updateProfile: async (payload) => {
    set({ error: null })
    try {
      const { user } = await authApi.updateProfile(payload)
      const normalized = normalizeAuthUser(user)
      set({ user: normalized, isAuthenticated: normalized !== null })
    } catch (error) {
      set({ error: extractErrorMessage(error) })
      throw error
    }
  },

  resendVerification: async () => {
    const { message } = await authApi.resendVerificationEmail()
    return message
  },
}))
