import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import LoginPage from '~/pages/login.vue'
import RegisterPage from '~/pages/register.vue'

describe('pages smoke', () => {
  it('login affiche le formulaire', async () => {
    const wrapper = await mountSuspended(LoginPage, { route: '/login' })
    expect(wrapper.find('[data-testid="login-email"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="login-submit"]').exists()).toBe(true)
  })

  it('register affiche le formulaire', async () => {
    const wrapper = await mountSuspended(RegisterPage, { route: '/register' })
    expect(wrapper.find('[data-testid="register-email"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-submit"]').exists()).toBe(true)
  })
})
