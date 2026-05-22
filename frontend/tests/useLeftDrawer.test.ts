import { describe, expect, it } from 'vitest'

import { useLeftDrawer } from '~/composables/useLeftDrawer'

describe('useLeftDrawer', () => {
  it('opens and closes the shared drawer state', () => {
    const drawer = useLeftDrawer()

    expect(drawer.open.value).toBe(false)
    drawer.openDrawer()
    expect(drawer.open.value).toBe(true)
    drawer.closeDrawer()
    expect(drawer.open.value).toBe(false)
  })
})
