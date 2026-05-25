import { useAppPinia } from '~/utils/pinia-app'

/** Access token en mémoire (Pinia) — non persisté en localStorage pour limiter le risque XSS. */
export function useAccessToken() {
  const pinia = useAppPinia()
  if (!pinia) {
    return {
      getToken: () => null,
      setToken: () => undefined,
      clearToken: () => undefined,
    }
  }

  const authStore = useAuthStore(pinia)

  return {
    getToken: () => authStore.accessToken ?? null,
    setToken: (token: string) => authStore.setToken(token),
    clearToken: () => authStore.clear(),
  }
}
