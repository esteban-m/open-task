import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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

  it('no-op sans Pinia ou token déjà présent', async () => {
    vi.stubGlobal('useNuxtApp', () => ({ $pinia: null }))
    await ensureSession()

    setActivePinia(createPinia())
    useAuthStore().setToken('existing')
    await ensureSession()
    expect(nuxtFetchMock).not.toHaveBeenCalled()
  })

  it('abandonne si Pinia disparaît pendant le refresh', async () => {
    resetSessionInit()
    const pinia = createPinia()
    setActivePinia(pinia)
    nuxtFetchMock.mockImplementation(async () => {
      vi.stubGlobal('useNuxtApp', () => ({ $pinia: null }))
      return { accessToken: 'late' }
    })
    await ensureSession()
    expect(useAuthStore(pinia).accessToken).toBeNull()
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
