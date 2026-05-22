import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import type { TaskList } from '~/stores/lists'
import type { Task } from '~/stores/tasks'
import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'

const handlers = new Map<string, (payload: unknown) => void>()
const joinList = vi.fn()
const joinLists = vi.fn()
const leaveList = vi.fn()

vi.mock('~/composables/useSocket', () => ({
  useSocket: () => ({
    on: (event: string, handler: (payload: unknown) => void) => {
      handlers.set(event, handler)
      return () => handlers.delete(event)
    },
    joinList,
    joinLists,
    leaveList,
  }),
}))

function mockList(id: string, name: string, color?: string): TaskList {
  return {
    id,
    name,
    userId: 'u1',
    createdAt: '',
    updatedAt: '',
    color,
  }
}

function mockTask(id: string, listId: string, shortDescription: string): Task {
  return {
    id,
    listId,
    shortDescription,
    longDescription: null,
    dueDate: '2024-12-31',
    completed: false,
    completedAt: null,
    createdAt: '',
    updatedAt: '',
  }
}

describe('useRealtimeSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    handlers.clear()
    joinList.mockClear()
    joinLists.mockClear()
    leaveList.mockClear()
    const { unbind } = useRealtimeSync()
    unbind()
  })

  it('bind applique task:created au store', () => {
    const lists = useListsStore()
    lists.lists = [mockList('l1', 'Liste', '#fff')]
    const { bind } = useRealtimeSync()
    bind()
    handlers.get('task:created')?.(mockTask('t1', 'l1', 'Tâche'))
    const tasks = useTasksStore()
    expect(tasks.allTasks.some((t) => t.id === 't1')).toBe(true)
  })

  it('list:revoked retire liste et tâches', () => {
    const lists = useListsStore()
    lists.lists = [mockList('l1', 'Liste')]
    const tasks = useTasksStore()
    const task = mockTask('t1', 'l1', 'X')
    tasks.setAllTasks([task])
    tasks.setTasks(tasks.allTasks)
    const { bind } = useRealtimeSync()
    bind()
    handlers.get('list:revoked')?.({ listId: 'l1' })
    expect(lists.lists).toHaveLength(0)
    expect(leaveList).toHaveBeenCalledWith('l1')
    expect(tasks.allTasks).toHaveLength(0)
  })

  it('bind applique task:updated et list:deleted', () => {
    const lists = useListsStore()
    lists.lists = [
      { id: 'l1', name: 'Liste', color: null, userId: 'u1', createdAt: '', updatedAt: '' },
    ]
    const tasks = useTasksStore()
    const task = {
      id: 't1',
      listId: 'l1',
      shortDescription: 'T',
      longDescription: null,
      dueDate: '2026-01-01',
      completed: false,
      completedAt: null,
      createdAt: '',
      updatedAt: '',
    }
    tasks.setAllTasks([task])
    tasks.setTasks([task])

    const { bind } = useRealtimeSync()
    bind()
    handlers.get('task:updated')?.({ ...task, shortDescription: 'Modifiée' })
    expect(tasks.allTasks[0].shortDescription).toBe('Modifiée')

    handlers.get('list:deleted')?.({ listId: 'l1' })
    expect(lists.lists).toHaveLength(0)
    expect(tasks.allTasks).toHaveLength(0)
  })

  it('syncListRooms appelle joinLists', () => {
    const lists = useListsStore()
    lists.lists = [mockList('l1', 'A'), mockList('l2', 'B')]
    const { syncListRooms } = useRealtimeSync()
    syncListRooms()
    expect(joinLists).toHaveBeenCalledWith(['l1', 'l2'])
  })
})
