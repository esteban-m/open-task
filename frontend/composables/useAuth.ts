import type { User } from '~/stores/auth'

import { useAppPinia } from '~/utils/pinia-app'

export function useAuth() {
  const pinia = useAppPinia()
  if (!pinia) {
    return {
      getToken: () => null,
      setToken: () => undefined,
      setUser: () => undefined,
      getUser: () => null,
      clear: () => {
        resetSessionInit()
      },
      isAuthenticated: false,
    }
  }

  const authStore = useAuthStore(pinia)

  return {
    getToken: () => authStore.accessToken ?? null,
    setToken: (token: string) => authStore.setToken(token),
    setUser: (user: User) => authStore.setUser(user),
    getUser: () => authStore.user ?? null,
    clear: () => {
      resetSessionInit()
      authStore.clear()
    },
    isAuthenticated: !!authStore.accessToken,
  }
}
