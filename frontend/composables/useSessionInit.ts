import type { Pinia } from 'pinia'

let sessionInitPromise: Promise<void> | null = null

function getAuthStore(pinia?: Pinia) {
  const activePinia = pinia ?? useNuxtApp().$pinia
  if (!activePinia) return null
  return useAuthStore(activePinia)
}

/** Restaure la session via le refresh token httpOnly (access token en mémoire Pinia). */
export function ensureSession(pinia?: Pinia): Promise<void> {
  if (!import.meta.client) return Promise.resolve()

  const authStore = getAuthStore(pinia)
  if (!authStore) return Promise.resolve()
  if (authStore.accessToken) return Promise.resolve()

  if (!sessionInitPromise) {
    sessionInitPromise = (async () => {
      const store = getAuthStore(pinia)
      if (!store) return

      try {
        const config = useRuntimeConfig()
        const { accessToken } = await $fetch<{ accessToken: string }>(
          `${config.public.apiBase}/auth/refresh`,
          { method: 'POST', credentials: 'include' },
        )
        store.setToken(accessToken)

        const user = await $fetch<{
          id: string
          email: string
          firstName: string
          lastName: string
        }>(`${config.public.apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        store.setUser(user)
      } catch {
        store.clear()
      }
    })()
  }

  return sessionInitPromise
}

export function resetSessionInit() {
  sessionInitPromise = null
}
