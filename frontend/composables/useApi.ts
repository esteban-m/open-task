// composables/useApi.ts
// Couche HTTP centralisée avec gestion du refresh token transparent

/** Client HTTP injectable (tests + useApi). */
export function createApiClient(deps: {
  getToken: () => string | null
  setToken: (token: string) => void
  clearToken: () => void
  apiBase: string
  fetchFn?: typeof fetch
  fetchAuth?: typeof $fetch
  pushRoute?: (path: string) => void | Promise<void>
}) {
  const fetchFn = deps.fetchFn ?? fetch
  const fetchAuth = deps.fetchAuth ?? $fetch
  const pushRoute = deps.pushRoute ?? (() => undefined)

  let refreshPromise: Promise<string | null> | null = null

  async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const response = await fetchAuth<{ accessToken: string }>(
          `${deps.apiBase}/auth/refresh`,
          { method: 'POST', credentials: 'include' },
        )
        deps.setToken(response.accessToken)
        return response.accessToken
      } catch {
        resetSessionInit()
        deps.clearToken()
        try {
          await fetchAuth(`${deps.apiBase}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          /* ignore */
        }
        await pushRoute('/login')
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  async function request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, string> } = {},
  ): Promise<T> {
    const url = `${deps.apiBase}${path}`
    const isPublicAuth = path === '/auth/login' || path === '/auth/register'
    const token = isPublicAuth ? null : deps.getToken()

    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    }

    let response = await fetchFn(url, fetchOptions)

    if (response.status === 401 && token && !isPublicAuth) {
      const newToken = await refreshAccessToken()
      if (!newToken) {
        return Promise.reject({
          status: 401,
          message: 'Session expirée. Veuillez vous reconnecter.',
        })
      }
      response = await fetchFn(url, {
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
    refreshAccessToken,
  }
}

export function useApi() {
  const config = useRuntimeConfig()
  const router = useRouter()
  const { getToken, setToken, clearToken } = useAccessToken()

  return createApiClient({
    getToken,
    setToken,
    clearToken,
    apiBase: config.public.apiBase,
    pushRoute: (path) => {
      void router.push(path)
    },
  })
}
