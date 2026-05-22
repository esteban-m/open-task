import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { loadAllTasksForCalendar } from '~/composables/useCalendarTasks'
import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'

const apiGet = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ get: apiGet }),
}))

vi.mock('~/composables/useTaskEnrichment', () => ({
  enrichTasksWithLists: (tasks: unknown[]) => tasks,
}))

const task = {
  id: 't1',
  listId: 'l1',
  shortDescription: 'Tâche',
  longDescription: null,
  dueDate: '2026-01-01',
  completed: false,
  completedAt: null,
  createdAt: '',
  updatedAt: '',
}

describe('loadAllTasksForCalendar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiGet.mockReset()
  })

  it('loads all tasks from /tasks when endpoint exists', async () => {
    apiGet.mockResolvedValue([task])

    await loadAllTasksForCalendar()

    const tasks = useTasksStore()
    expect(apiGet).toHaveBeenCalledWith('/tasks')
    expect(tasks.allTasks).toHaveLength(1)
    expect(tasks.allTasksLoading).toBe(false)
  })

  it('falls back to per-list fetch on 404', async () => {
    apiGet.mockImplementation((path: string) => {
      if (path === '/tasks') {
        return Promise.reject({ status: 404 })
      }
      if (path === '/lists') {
        return Promise.resolve([
          { id: 'l1', name: 'Liste', userId: 'u1', createdAt: '', updatedAt: '' },
        ])
      }
      if (path === '/lists/l1/tasks') {
        return Promise.resolve([task])
      }
      return Promise.resolve([])
    })

    await loadAllTasksForCalendar()

    expect(useTasksStore().allTasks).toHaveLength(1)
  })

  it('clears tasks when list loading fails', async () => {
    apiGet.mockImplementation((path: string) => {
      if (path === '/tasks') return Promise.reject({ status: 404 })
      if (path === '/lists') return Promise.reject(new Error('network'))
      return Promise.resolve([])
    })

    const lists = useListsStore()
    lists.setLists([])

    await loadAllTasksForCalendar()

    expect(useTasksStore().allTasks).toHaveLength(0)
  })
})
