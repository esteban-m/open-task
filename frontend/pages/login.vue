<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo / Titre -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-2.5 mb-3">
          <AppLogo />
          <span class="text-xl font-semibold tracking-tight">Open-Task</span>
        </div>
        <p class="text-text-muted text-sm">Bon retour parmi nous</p>
      </div>

      <!-- Formulaire -->
      <div class="bg-surface-1 border border-border rounded-xl p-6">
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-text-muted mb-1.5">Email</label>
              <input
                v-model="form.email"
                type="email"
                data-testid="login-email"
                placeholder="jean@exemple.fr"
                autocomplete="email"
                required
                class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label class="block text-sm text-text-muted mb-1.5">Mot de passe</label>
              <input
                v-model="form.password"
                type="password"
                data-testid="login-password"
                placeholder="••••••••"
                autocomplete="current-password"
                required
                class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              data-testid="login-submit"
              :disabled="loading"
              class="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded py-2.5 mt-1"
            >
              <span v-if="loading">Connexion…</span>
              <span v-else>Se connecter</span>
            </button>
          </div>
        </form>
      </div>

      <p class="text-center text-sm text-text-muted mt-4">
        Pas encore de compte ?
        <NuxtLink to="/register" class="text-accent hover:text-accent-hover">Créer un compte</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

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

    const user = await api.get<{ id: string; email: string; firstName: string; lastName: string }>('/auth/me')
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
</script>
