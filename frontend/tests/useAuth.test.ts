import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useAuthStore } from '~/stores/auth'

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
})
