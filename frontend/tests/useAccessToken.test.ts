import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAccessToken } from '~/composables/useAccessToken'
import { useAuthStore } from '~/stores/auth'
import * as piniaApp from '~/utils/pinia-app'

describe('useAccessToken', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('lit et écrit le jeton via Pinia', () => {
    const { getToken, setToken, clearToken } = useAccessToken()
    expect(getToken()).toBeNull()
    setToken('tok')
    expect(getToken()).toBe('tok')
    expect(useAuthStore().accessToken).toBe('tok')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('no-op sans Pinia', () => {
    vi.spyOn(piniaApp, 'useAppPinia').mockReturnValue(null)
    const { getToken, setToken, clearToken } = useAccessToken()
    expect(getToken()).toBeNull()
    setToken('x')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
