<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-2.5 mb-3">
          <AppLogo />
          <span class="text-xl font-semibold tracking-tight">Open-Task</span>
        </div>
        <p class="text-text-muted text-sm">Créez votre espace de travail</p>
      </div>

      <div class="bg-surface-1 border border-border rounded-xl p-6">
        <form @submit.prevent="handleRegister">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-text-muted mb-1.5">Prénom</label>
                <input
                  v-model="form.firstName"
                  type="text"
                  placeholder="Jean"
                  required
                  class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label class="block text-sm text-text-muted mb-1.5">Nom</label>
                <input
                  v-model="form.lastName"
                  type="text"
                  placeholder="Dupont"
                  required
                  class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm text-text-muted mb-1.5">Email</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="jean@exemple.fr"
                required
                class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label class="block text-sm text-text-muted mb-1.5">Confirmation email</label>
              <input
                v-model="form.emailConfirm"
                type="email"
                placeholder="jean@exemple.fr"
                required
                class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label class="block text-sm text-text-muted mb-1.5">Mot de passe</label>
              <input
                v-model="form.password"
                type="password"
                placeholder="8 caractères minimum"
                required
                class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label class="block text-sm text-text-muted mb-1.5">Confirmation mot de passe</label>
              <input
                v-model="form.passwordConfirm"
                type="password"
                placeholder="••••••••"
                required
                class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2.5 text-text placeholder-text-faint focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded py-2.5 mt-1"
            >
              <span v-if="loading">Création…</span>
              <span v-else>Créer mon compte</span>
            </button>
          </div>
        </form>
      </div>

      <p class="text-center text-sm text-text-muted mt-4">
        Déjà un compte ?
        <NuxtLink to="/login" class="text-accent hover:text-accent-hover">Se connecter</NuxtLink>
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

    const user = await api.get<{ id: string; email: string; firstName: string; lastName: string }>('/auth/me')
    setUser(user)

    bindRealtime()
    await socket.connect()
    router.push('/')
  } catch (e: unknown) {
    toast.fromApiError(e, 'Erreur lors de la création du compte')
  } finally {
    loading.value = false
  }
}
</script>
