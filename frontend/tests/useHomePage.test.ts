import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'

const get = vi.fn()
const connect = vi.fn().mockResolvedValue(undefined)
const syncListRooms = vi.fn()
const loadTasksForList = vi.fn().mockResolvedValue(undefined)
const switchList = vi.fn()
const loadAllTasksForCalendar = vi.fn().mockResolvedValue(undefined)

vi.mock('~/composables/useApi', () => ({ useApi: () => ({ get }) }))
vi.mock('~/composables/useSocket', () => ({ useSocket: () => ({ connect }) }))
vi.mock('~/composables/useListTasks', () => ({
  useListTasks: () => ({ loadTasksForList, switchList }),
}))
vi.mock('~/composables/useRealtimeSync', () => ({
  useRealtimeSync: () => ({ syncListRooms }),
}))
vi.mock('~/composables/useCalendarTasks', () => ({
  loadAllTasksForCalendar: (...args: unknown[]) => loadAllTasksForCalendar(...args),
}))

const Harness = defineComponent({
  setup() {
    useHomePage()
  },
  template: '<div />',
})

describe('useHomePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    get.mockResolvedValue([{ id: 'l1', name: 'Todo' }])
    localStorage.clear()
  })

  it('charge les listes et connecte la socket au montage', async () => {
    localStorage.setItem('selectedListId', 'l1')
    await mountSuspended(Harness)
    await vi.waitFor(() => {
      expect(get).toHaveBeenCalledWith('/lists')
      expect(connect).toHaveBeenCalled()
      expect(syncListRooms).toHaveBeenCalled()
      expect(useListsStore().selectedListId).toBe('l1')
    })
  })

  it('charge le calendrier si la vue est enregistrée', async () => {
    localStorage.setItem('mainContentView', 'calendar')
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(loadAllTasksForCalendar).toHaveBeenCalled())
  })

  it('réagit au changement de liste sélectionnée', async () => {
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(get).toHaveBeenCalled())
    const lists = useListsStore()
    lists.selectList('l1')
    await nextTick()
    lists.selectList('l2')
    await vi.waitFor(() => {
      expect(switchList).toHaveBeenCalled()
      expect(loadTasksForList).toHaveBeenCalledWith('l2')
    })
  })

  it('log une erreur si le chargement des listes échoue', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    get.mockRejectedValue(new Error('lists fail'))
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled())
    errorSpy.mockRestore()
  })

  it('désélectionne la tâche si elle n’est plus visible', async () => {
    await mountSuspended(Harness)
    const tasks = useTasksStore()
    tasks.selectTask('missing')
    const lists = useListsStore()
    lists.selectList('l1')
    await nextTick()
    lists.selectList('l2')
    await vi.waitFor(() => expect(tasks.selectedTaskId).toBeNull())
  })
})
