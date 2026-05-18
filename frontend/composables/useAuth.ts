import type { User } from '~/stores/auth'

export function useAuth() {
  const pinia = useNuxtApp().$pinia
  const authStore = pinia ? useAuthStore(pinia) : null

  return {
    getToken: () => authStore?.accessToken ?? null,
    setToken: (token: string) => authStore?.setToken(token),
    setUser: (user: User) => authStore?.setUser(user),
    getUser: () => authStore?.user ?? null,
    clear: () => {
      resetSessionInit()
      authStore?.clear()
    },
    isAuthenticated: !!authStore?.accessToken,
  }
}
