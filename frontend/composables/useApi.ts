// composables/useApi.ts
// Couche HTTP centralisée avec gestion du refresh token transparent

export function useApi() {
  const config = useRuntimeConfig()
  const router = useRouter()
  const { getToken, setToken, clearToken } = useAccessToken()

  let refreshPromise: Promise<string | null> | null = null

  async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const response = await $fetch<{ accessToken: string }>(
          `${config.public.apiBase}/auth/refresh`,
          { method: 'POST', credentials: 'include' }
        )
        setToken(response.accessToken)
        return response.accessToken
      } catch {
        clearToken()
        try {
          await $fetch(`${config.public.apiBase}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          /* ignore */
        }
        router.push('/login')
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  async function request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, string> } = {}
  ): Promise<T> {
    const url = `${config.public.apiBase}${path}`
    const isPublicAuth = path === '/auth/login' || path === '/auth/register'
    const token = isPublicAuth ? null : getToken()

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

    // Tentative de refresh si 401 (pas sur login/register : 401 = identifiants invalides)
    if (response.status === 401 && token && !isPublicAuth) {
      const newToken = await refreshAccessToken()
      if (!newToken) {
        return Promise.reject({
          status: 401,
          message: 'Session expirée. Veuillez vous reconnecter.',
        })
      }
      response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Bearer ${newToken}`,
        },
      })
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      const raw = error.message
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : typeof raw === 'string'
          ? raw
          : 'Erreur'
      throw { status: response.status, message }
    }

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
