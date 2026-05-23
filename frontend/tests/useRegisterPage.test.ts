import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn()
const get = vi.fn()
const push = vi.fn()
const error = vi.fn()
const fromApiError = vi.fn()

vi.mock('~/composables/useApi', () => ({ useApi: () => ({ post, get }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('~/composables/useRealtimeSync', () => ({ useRealtimeSync: () => ({ bind: vi.fn() }) }))
vi.mock('~/composables/useSocket', () => ({ useSocket: () => ({ connect: vi.fn() }) }))
vi.mock('~/composables/useToast', () => ({ useToast: () => ({ error, fromApiError }) }))

describe('useRegisterPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('valide la confirmation email', async () => {
    const { form, handleRegister } = useRegisterPage()
    form.email = 'a@b.fr'
    form.emailConfirm = 'b@b.fr'
    await handleRegister()
    expect(error).toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it('valide la confirmation mot de passe', async () => {
    const { form, handleRegister } = useRegisterPage()
    form.email = form.emailConfirm = 'a@b.fr'
    form.password = '12345678'
    form.passwordConfirm = '87654321'
    await handleRegister()
    expect(error).toHaveBeenCalled()
  })

  it('valide la longueur du mot de passe', async () => {
    const { form, handleRegister } = useRegisterPage()
    form.email = form.emailConfirm = 'a@b.fr'
    form.password = form.passwordConfirm = 'short'
    await handleRegister()
    expect(error).toHaveBeenCalled()
  })

  it('affiche une erreur API à l’inscription', async () => {
    const { form, handleRegister } = useRegisterPage()
    form.firstName = 'A'
    form.lastName = 'B'
    form.email = form.emailConfirm = 'a@b.fr'
    form.password = form.passwordConfirm = 'password1'
    post.mockRejectedValue({ status: 400 })
    await handleRegister()
    expect(fromApiError).toHaveBeenCalled()
  })

  it('inscrit l’utilisateur si le formulaire est valide', async () => {
    post.mockResolvedValue({ accessToken: 'tok' })
    get.mockResolvedValue({ id: 'u1', email: 'a@b.fr', firstName: 'A', lastName: 'B' })
    const { form, handleRegister } = useRegisterPage()
    form.firstName = 'A'
    form.lastName = 'B'
    form.email = form.emailConfirm = 'a@b.fr'
    form.password = form.passwordConfirm = 'password1'
    await handleRegister()
    expect(post).toHaveBeenCalled()
  })
})
