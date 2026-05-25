import { describe, expect, it } from 'vitest'
import { createPinia } from 'pinia'

import { resolveAppPinia } from '~/utils/pinia-app'

describe('resolveAppPinia', () => {
  it('préfère la Pinia Nuxt', () => {
    const nuxt = createPinia()
    const active = createPinia()
    expect(resolveAppPinia(nuxt, active)).toBe(nuxt)
  })

  it('retombe sur la Pinia active', () => {
    const active = createPinia()
    expect(resolveAppPinia(null, active)).toBe(active)
    expect(resolveAppPinia(undefined, active)).toBe(active)
  })

  it('retourne null sans Pinia', () => {
    expect(resolveAppPinia(null, null)).toBeNull()
  })
})
