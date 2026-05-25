import { describe, expect, it } from 'vitest'
import { createPinia } from 'pinia'

import { resolveAppPinia } from '~/utils/pinia-app'

describe('resolveAppPinia', () => {
  it('préfère la Pinia Nuxt', () => {
    const nuxt = createPinia()
    const active = createPinia()
    expect(resolveAppPinia(nuxt, active)).toBe(nuxt)
  })

  it('retombe sur la Pinia active si Nuxt sans $pinia', () => {
    const active = createPinia()
    expect(resolveAppPinia(undefined, active)).toBe(active)
    expect(resolveAppPinia(undefined, null)).toBeNull()
    expect(resolveAppPinia(undefined, undefined)).toBeNull()
  })

  it('retourne null si Nuxt expose $pinia null', () => {
    expect(resolveAppPinia(null, null)).toBeNull()
    expect(resolveAppPinia(null, createPinia())).toBeNull()
  })
})
