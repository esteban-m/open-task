/** Access token en mémoire (Pinia) — non persisté en localStorage pour limiter le risque XSS. */
export function useAccessToken() {
  const pinia = useNuxtApp().$pinia
  const authStore = pinia ? useAuthStore(pinia) : null

  function getToken(): string | null {
    return authStore?.accessToken ?? null
  }

  function setToken(token: string) {
    authStore?.setToken(token)
  }

  function clearToken() {
    authStore?.clear()
  }

  return { getToken, setToken, clearToken }
}
