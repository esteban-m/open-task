import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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
    lists.lists = [{ id: 'l1', name: 'Liste', color: '#fff', ownerId: 'u1', createdAt: '', updatedAt: '' }]
    const { bind } = useRealtimeSync()
    bind()
    handlers.get('task:created')?.({
      id: 't1',
      listId: 'l1',
      shortDescription: 'Tâche',
      completed: false,
      createdAt: '',
      updatedAt: '',
    })
    const tasks = useTasksStore()
    expect(tasks.allTasks.some((t) => t.id === 't1')).toBe(true)
  })

  it('list:revoked retire liste et tâches', () => {
    const lists = useListsStore()
    lists.lists = [{ id: 'l1', name: 'Liste', color: null, ownerId: 'u1', createdAt: '', updatedAt: '' }]
    const tasks = useTasksStore()
    tasks.setAllTasks([
      { id: 't1', listId: 'l1', shortDescription: 'X', completed: false, createdAt: '', updatedAt: '' },
    ])
    tasks.setTasks(tasks.allTasks)
    const { bind } = useRealtimeSync()
    bind()
    handlers.get('list:revoked')?.({ listId: 'l1' })
    expect(lists.lists).toHaveLength(0)
    expect(leaveList).toHaveBeenCalledWith('l1')
    expect(tasks.allTasks).toHaveLength(0)
  })

  it('syncListRooms appelle joinLists', () => {
    const lists = useListsStore()
    lists.lists = [
      { id: 'l1', name: 'A', color: null, ownerId: 'u1', createdAt: '', updatedAt: '' },
      { id: 'l2', name: 'B', color: null, ownerId: 'u1', createdAt: '', updatedAt: '' },
    ]
    const { syncListRooms } = useRealtimeSync()
    syncListRooms()
    expect(joinLists).toHaveBeenCalledWith(['l1', 'l2'])
  })
})
