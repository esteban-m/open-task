import { beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as runtimeFlags from '~/utils/runtime-flags'

/** CI Nuxt Vitest tourne souvent en SSR : forcer le mode client pour les composables. */
vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
vi.spyOn(runtimeFlags, 'isRuntimeServer').mockReturnValue(false)

beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
  vi.stubGlobal('useNuxtApp', () => ({ $pinia: pinia }))
})
