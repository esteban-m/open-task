import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import AppLogo from '~/components/ui/AppLogo.vue'

describe('AppLogo', () => {
  it('renders accessible brand image', async () => {
    const wrapper = await mountSuspended(AppLogo, { props: { size: 'md' } })
    const img = wrapper.find('img')

    expect(img.attributes('alt')).toBe('Open-Task')
    expect(img.attributes('src') ?? '').toMatch(/^data:image\/svg\+xml|^\/hero\.svg/)
    expect(img.classes()).toContain('w-10')
  })
})
