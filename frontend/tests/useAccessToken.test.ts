import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useAccessToken } from '~/composables/useAccessToken'

const AccessTokenHarness = defineComponent({
  name: 'AccessTokenHarness',
  setup() {
    const token = useAccessToken()
    return { token }
  },
  template: '<div />',
})

describe('useAccessToken', () => {
  it('reads and writes token via auth store', async () => {
    const wrapper = await mountSuspended(AccessTokenHarness)
    const { getToken, setToken, clearToken } = wrapper.vm.token

    expect(getToken()).toBeNull()
    setToken('access-123')
    expect(getToken()).toBe('access-123')

    clearToken()
    expect(getToken()).toBeNull()
  })

  it('no-op sans Pinia', async () => {
    vi.stubGlobal('useNuxtApp', () => ({ $pinia: null }))
    const wrapper = await mountSuspended(AccessTokenHarness)
    const { getToken, setToken, clearToken } = wrapper.vm.token
    expect(getToken()).toBeNull()
    setToken('x')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
