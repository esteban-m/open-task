const COOKIE_NAME = 'access_token'
const MAX_AGE = 60 * 15 // aligné sur JWT access (15m)

export function useAccessToken() {
  const cookie = useCookie<string | null>(COOKIE_NAME, {
    maxAge: MAX_AGE,
    sameSite: 'lax',
    path: '/',
    secure: import.meta.env.PROD,
    default: () => null,
  })

  function getToken(): string | null {
    if (cookie.value) return cookie.value
    if (import.meta.client) {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  function setToken(token: string) {
    cookie.value = token
    if (import.meta.client) {
      localStorage.setItem('accessToken', token)
    }
  }

  function clearToken() {
    cookie.value = null
    if (import.meta.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    }
  }

  return { cookie, getToken, setToken, clearToken }
}
