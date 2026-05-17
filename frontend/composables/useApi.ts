// composables/useApi.ts
// Couche HTTP centralisée avec gestion du refresh token transparent

export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const router = useRouter()

  let isRefreshing = false
  let refreshQueue: Array<(token: string) => void> = []

  async function refreshAccessToken(): Promise<string | null> {
    try {
      const response = await $fetch<{ accessToken: string }>(
        `${config.public.apiBase}/auth/refresh`,
        { method: 'POST', credentials: 'include' }
      )
      authStore.setAccessToken(response.accessToken)
      return response.accessToken
    } catch {
      authStore.clear()
      router.push('/login')
      return null
    }
  }

  async function request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, string> } = {}
  ): Promise<T> {
    const url = `${config.public.apiBase}${path}`
    const token = authStore.accessToken

    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    }

    let response = await fetch(url, fetchOptions)

    // Tentative de refresh si 401
    if (response.status === 401 && token) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshAccessToken()
        isRefreshing = false

        if (newToken) {
          // Rejouer les requêtes en attente
          refreshQueue.forEach((cb) => cb(newToken))
          refreshQueue = []

          // Rejouer cette requête avec le nouveau token
          response = await fetch(url, {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              Authorization: `Bearer ${newToken}`,
            },
          })
        } else {
          return Promise.reject(new Error('Session expirée'))
        }
      } else {
        // Attendre que le refresh en cours se termine
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push(async (newToken: string) => {
            try {
              const r = await fetch(url, {
                ...fetchOptions,
                headers: {
                  ...fetchOptions.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              })
              resolve(await r.json())
            } catch (e) {
              reject(e)
            }
          })
        })
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw { status: response.status, message: error.message || 'Erreur' }
    }

    // Réponse vide (ex: 204)
    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
