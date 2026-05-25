import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { handleSelectedListIdChange } from '~/composables/useHomePage'
import { useTasksStore } from '~/stores/tasks'

describe('handleSelectedListIdChange', () => {
  const switchList = vi.fn()
  const loadTasksForList = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('no-op si listId identique à prev', async () => {
    await handleSelectedListIdChange('l1', 'l1', {
      switchList,
      loadTasksForList,
      tasksStore: useTasksStore(),
    })
    expect(switchList).not.toHaveBeenCalled()
    expect(loadTasksForList).not.toHaveBeenCalled()
  })

  it('no-op sans listId', async () => {
    await handleSelectedListIdChange(null, 'l1', {
      switchList,
      loadTasksForList,
      tasksStore: useTasksStore(),
    })
    expect(switchList).not.toHaveBeenCalled()
  })
})
