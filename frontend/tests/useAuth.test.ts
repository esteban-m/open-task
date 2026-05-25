import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useAuthStore } from '~/stores/auth'
import * as piniaApp from '~/utils/pinia-app'

vi.mock('~/composables/useSessionInit', () => ({
  resetSessionInit: vi.fn(),
  ensureSession: vi.fn().mockResolvedValue(undefined),
}))

const AuthHarness = defineComponent({
  setup() {
    const auth = useAuth()
    return { auth }
  },
  template: '<div />',
})

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('getToken et getUser quand le store est vide', async () => {
    const wrapper = await mountSuspended(AuthHarness)
    const { auth } = wrapper.vm
    const store = useAuthStore()
    store.$patch({ accessToken: undefined, user: undefined })

    expect(auth.getToken()).toBeNull()
    expect(auth.getUser()).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('delegates to auth store', async () => {
    const wrapper = await mountSuspended(AuthHarness)
    const { auth } = wrapper.vm

    auth.setToken('tok')
    auth.setUser({
      id: 'u1',
      email: 'a@b.fr',
      firstName: 'A',
      lastName: 'B',
    })

    expect(auth.getToken()).toBe('tok')
    expect(auth.getUser()?.email).toBe('a@b.fr')
    expect(useAuthStore().isAuthenticated).toBe(true)

    auth.clear()
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('fonctionne sans Pinia (no-op)', () => {
    vi.spyOn(piniaApp, 'useAppPinia').mockReturnValue(null)
    const auth = useAuth()

    expect(auth.getToken()).toBeNull()
    expect(auth.getUser()).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    auth.setToken('x')
    auth.setUser({
      id: 'u1',
      email: 'a@b.fr',
      firstName: 'A',
      lastName: 'B',
    })
    auth.clear()
    expect(auth.getToken()).toBeNull()
  })
})
