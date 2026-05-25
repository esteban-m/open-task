import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { ensureSession, resetSessionInit } from '~/composables/useSessionInit'
import { useAuthStore } from '~/stores/auth'

describe('useSessionInit', () => {
  beforeEach(() => {
    resetSessionInit()
    setActivePinia(createPinia())
    useAuthStore().clear()
    vi.stubGlobal('$fetch', vi.fn())
    vi.mocked($fetch).mockReset()
  })

  afterEach(() => {
    resetSessionInit()
    vi.mocked($fetch).mockReset()
  })

  it('restores session from refresh + me endpoints', async () => {
    vi.mocked($fetch)
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
    expect($fetch).not.toHaveBeenCalled()
  })

  it('efface le store si refresh échoue', async () => {
    resetSessionInit()
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useAuthStore(pinia)
    expect(store.accessToken).toBeNull()
    vi.mocked($fetch).mockRejectedValue(new Error('refresh failed'))
    await ensureSession(pinia)
    expect(store.accessToken).toBeNull()
  })

})
