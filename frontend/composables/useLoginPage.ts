export function useLoginPage() {
  const router = useRouter()
  const api = useApi()
  const socket = useSocket()
  const { bind: bindRealtime } = useRealtimeSync()
  const { setToken, setUser } = useAuth()

  const toast = useToast()
  const form = reactive({ email: '', password: '' })
  const loading = ref(false)

  async function handleLogin() {
    loading.value = true
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/login', form)
      setToken(accessToken)

      const user = await api.get<{
        id: string
        email: string
        firstName: string
        lastName: string
      }>('/auth/me')
      setUser(user)

      bindRealtime()
      await router.push('/')
      void socket.connect()
    } catch (e: unknown) {
      toast.fromApiError(e, 'Identifiants incorrects')
    } finally {
      loading.value = false
    }
  }

  return { form, loading, handleLogin }
}
