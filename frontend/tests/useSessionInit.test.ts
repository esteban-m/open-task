import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as runtimeFlags from '~/utils/runtime-flags'
import * as piniaApp from '~/utils/pinia-app'

import { ensureSession, resetSessionInit } from '~/composables/useSessionInit'
import { useAuthStore } from '~/stores/auth'

const { nuxtFetchMock } = vi.hoisted(() => ({
  nuxtFetchMock: vi.fn(),
}))

describe('useSessionInit', () => {
  beforeEach(() => {
    resetSessionInit()
    setActivePinia(createPinia())
    useAuthStore().clear()
    vi.stubGlobal('$fetch', nuxtFetchMock)
    nuxtFetchMock.mockReset()
  })

  afterEach(() => {
    resetSessionInit()
    nuxtFetchMock.mockReset()
    vi.restoreAllMocks()
  })

  it('restores session from refresh + me endpoints', async () => {
    nuxtFetchMock
      .mockResolvedValueOnce({ accessToken: 'new-tok' })
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.fr',
        firstName: 'A',
        lastName: 'B',
      })

    await ensureSession()

    const store = useAuthStore()
    expect(store.accessToken).toBe('new-tok')
    expect(store.user?.email).toBe('a@b.fr')
  })

  it('exposes resetSessionInit to drop in-flight init', () => {
    expect(() => resetSessionInit()).not.toThrow()
  })

  it('no-op côté serveur (pas client)', async () => {
    const clientSpy = vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(false)
    await ensureSession()
    expect(nuxtFetchMock).not.toHaveBeenCalled()
    clientSpy.mockRestore()
  })

  it('no-op sans Pinia ou token déjà présent', async () => {
    vi.spyOn(piniaApp, 'useAppPinia').mockReturnValue(null)
    await ensureSession()

    vi.restoreAllMocks()
    setActivePinia(createPinia())
    useAuthStore().setToken('existing')
    await ensureSession()
    expect(nuxtFetchMock).not.toHaveBeenCalled()
  })

  it('interrompt si Pinia disparaît avant la fin du refresh', async () => {
    resetSessionInit()
    const pinia = createPinia()
    setActivePinia(pinia)
    let calls = 0
    vi.spyOn(piniaApp, 'useAppPinia').mockImplementation(() => {
      calls += 1
      return calls === 1 ? pinia : null
    })
    nuxtFetchMock.mockResolvedValueOnce({ accessToken: 'late' })
    await ensureSession()
    expect(useAuthStore(pinia).accessToken).toBeNull()
    expect(nuxtFetchMock).not.toHaveBeenCalled()
  })

  it('passe un Pinia explicite à getAuthStore', async () => {
    resetSessionInit()
    const pinia = createPinia()
    nuxtFetchMock
      .mockResolvedValueOnce({ accessToken: 'explicit' })
      .mockResolvedValueOnce({
        id: 'u2',
        email: 'b@c.fr',
        firstName: 'B',
        lastName: 'C',
      })
    await ensureSession(pinia)
    expect(useAuthStore(pinia).accessToken).toBe('explicit')
  })

  it('efface le store si refresh échoue', async () => {
    resetSessionInit()
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useAuthStore(pinia)
    expect(store.accessToken).toBeNull()
    nuxtFetchMock.mockRejectedValue(new Error('refresh failed'))
    await ensureSession(pinia)
    expect(store.accessToken).toBeNull()
  })
})
