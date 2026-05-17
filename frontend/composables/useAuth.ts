export function useAuth() {
  const { getToken, setToken, clearToken } = useAccessToken()

  const setUser = (user: unknown) => {
    if (import.meta.client) {
      localStorage.setItem('user', JSON.stringify(user))
    }
  }

  const getUser = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('user')
      if (stored) return JSON.parse(stored)
    }
    return null
  }

  const clear = () => {
    clearToken()
  }

  return {
    getToken,
    setToken,
    setUser,
    getUser,
    clear,
    isAuthenticated: !!getToken(),
  }
}
