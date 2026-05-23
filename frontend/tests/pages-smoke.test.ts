import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import IndexPage from '~/pages/index.vue'
import LoginPage from '~/pages/login.vue'
import RegisterPage from '~/pages/register.vue'

vi.mock('~/components/layout/LeftSidebar.vue', () => ({ default: { template: '<aside />' } }))
vi.mock('~/components/layout/RightSidebar.vue', () => ({ default: { template: '<aside />' } }))
vi.mock('~/components/layout/MainContent.vue', () => ({ default: { template: '<main />' } }))

const get = vi.fn().mockResolvedValue([{ id: 'l1', name: 'Todo' }])
const connect = vi.fn().mockResolvedValue(undefined)
const syncListRooms = vi.fn()
const loadTasksForList = vi.fn().mockResolvedValue(undefined)
const switchList = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ get }),
}))

vi.mock('~/composables/useSocket', () => ({
  useSocket: () => ({ connect }),
}))

vi.mock('~/composables/useListTasks', () => ({
  useListTasks: () => ({ loadTasksForList, switchList }),
}))

vi.mock('~/composables/useRealtimeSync', () => ({
  useRealtimeSync: () => ({ syncListRooms, bind: vi.fn() }),
}))

describe('pages smoke', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    get.mockResolvedValue([{ id: 'l1', name: 'Todo' }])
  })
  it('index charge les listes au montage', async () => {
    localStorage.setItem('selectedListId', 'l1')
    const wrapper = await mountSuspended(IndexPage, { route: '/' })
    await wrapper.vm.$nextTick()
    expect(get).toHaveBeenCalledWith('/lists')
    expect(connect).toHaveBeenCalled()
    expect(syncListRooms).toHaveBeenCalled()
    localStorage.removeItem('selectedListId')
    localStorage.removeItem('mainContentView')
  })

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
