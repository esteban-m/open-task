import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '~/stores/auth'

const post = vi.fn()
const get = vi.fn()
const push = vi.fn()
const bind = vi.fn()
const connect = vi.fn()
const fromApiError = vi.fn()

vi.mock('~/composables/useApi', () => ({ useApi: () => ({ post, get }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('~/composables/useRealtimeSync', () => ({ useRealtimeSync: () => ({ bind }) }))
vi.mock('~/composables/useSocket', () => ({ useSocket: () => ({ connect }) }))
vi.mock('~/composables/useToast', () => ({ useToast: () => ({ fromApiError }) }))

describe('useLoginPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    post.mockResolvedValue({ accessToken: 'tok' })
    get.mockResolvedValue({
      id: 'u1',
      email: 'a@b.fr',
      firstName: 'A',
      lastName: 'B',
    })
    push.mockResolvedValue(undefined)
  })

  it('connecte l’utilisateur après login réussi', async () => {
    const { form, handleLogin } = useLoginPage()
    form.email = 'a@b.fr'
    form.password = 'secret'
    await handleLogin()
    expect(post).toHaveBeenCalledWith('/auth/login', form)
    expect(useAuthStore().accessToken).toBe('tok')
    expect(bind).toHaveBeenCalled()
    expect(connect).toHaveBeenCalled()
  })

  it('affiche une erreur API', async () => {
    post.mockRejectedValue({ status: 401 })
    const { handleLogin } = useLoginPage()
    await handleLogin()
    expect(fromApiError).toHaveBeenCalled()
  })
})
