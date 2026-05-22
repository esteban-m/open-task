import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { ensureSession, resetSessionInit } from '~/composables/useSessionInit'
import { useAuthStore } from '~/stores/auth'

describe('useSessionInit', () => {
  beforeEach(() => {
    resetSessionInit()
    setActivePinia(createPinia())
    vi.stubGlobal('$fetch', vi.fn())
  })

  afterEach(() => {
    resetSessionInit()
  })

  it('restores session from refresh + me endpoints', async () => {
    vi.mocked($fetch).mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/refresh')) return { accessToken: 'new-tok' }
      return { id: 'u1', email: 'a@b.fr', firstName: 'A', lastName: 'B' }
    })

    await ensureSession()

    const store = useAuthStore()
    expect(store.accessToken).toBe('new-tok')
    expect(store.user?.email).toBe('a@b.fr')
  })

  it('exposes resetSessionInit to drop in-flight init', () => {
    expect(() => resetSessionInit()).not.toThrow()
  })
})
