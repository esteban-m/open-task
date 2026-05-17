// Migre les sessions existantes (localStorage seul) vers le cookie lu par le SSR
export default defineNuxtPlugin({
  name: 'auth-sync',
  enforce: 'pre',
  setup() {
    const { cookie, setToken } = useAccessToken()
    const stored = localStorage.getItem('accessToken')
    if (stored && !cookie.value) {
      setToken(stored)
    }
  },
})
