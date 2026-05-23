export function useRegisterPage() {
  const router = useRouter()
  const api = useApi()
  const socket = useSocket()
  const { bind: bindRealtime } = useRealtimeSync()
  const { setToken, setUser } = useAuth()

  const toast = useToast()
  const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    emailConfirm: '',
    password: '',
    passwordConfirm: '',
  })
  const loading = ref(false)

  async function handleRegister() {
    if (form.email !== form.emailConfirm) {
      toast.error('Les adresses email ne correspondent pas')
      return
    }
    if (form.password !== form.passwordConfirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    loading.value = true
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      })
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
      toast.fromApiError(e, 'Erreur lors de la création du compte')
    } finally {
      loading.value = false
    }
  }

  return { form, loading, handleRegister }
}
