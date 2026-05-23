import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useTasksStore } from '~/stores/tasks'

const get = vi.fn()
const joinList = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ get }),
}))

vi.mock('~/composables/useSocket', () => ({
  useSocket: () => ({ joinList }),
}))

const LoadTasksHarness = defineComponent({
  async setup() {
    const { loadTasksForList } = useListTasks()
    await loadTasksForList('l1')
  },
  template: '<div />',
})

const SwitchListHarness = defineComponent({
  async setup() {
    const { switchList } = useListTasks()
    switchList('l2', 'l1')
  },
  template: '<div />',
})

describe('useListTasks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    get.mockResolvedValue([{ id: 't1', listId: 'l1', shortDescription: 'A' }])
  })

  it('loadTasksForList fills tasks store', async () => {
    await mountSuspended(LoadTasksHarness)

    const tasks = useTasksStore()
    expect(tasks.tasks).toHaveLength(1)
    expect(tasks.loading).toBe(false)
  })

  it('vide les tâches en cas d’erreur API', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    get.mockRejectedValueOnce(new Error('fail'))
    await mountSuspended(LoadTasksHarness)
    expect(useTasksStore().tasks).toHaveLength(0)
    errorSpy.mockRestore()
  })

  it('switchList joins socket room and persists selection', async () => {
    await mountSuspended(SwitchListHarness)

    expect(joinList).toHaveBeenCalledWith('l2')
    expect(localStorage.getItem('selectedListId')).toBe('l2')
  })
})
