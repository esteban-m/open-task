import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import type { Task } from '~/stores/tasks'
import type { TaskList } from '~/stores/lists'
import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'

const get = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ get }),
}))

function task(id: string, listId: string): Task {
  return {
    id,
    listId,
    shortDescription: 'T',
    longDescription: null,
    dueDate: '2026-01-01',
    completed: false,
    completedAt: null,
    createdAt: '',
    updatedAt: '',
  }
}

function list(id: string): TaskList {
  return { id, name: `List ${id}`, userId: 'u1', createdAt: '', updatedAt: '' }
}

describe('loadAllTasksForCalendar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const tasks = useTasksStore()
    tasks.setAllTasks([])
    tasks.setAllTasksLoading(false)
  })

  it('charge via GET /tasks quand disponible', async () => {
    const lists = useListsStore()
    lists.setLists([list('l1')])
    get.mockResolvedValueOnce([task('t1', 'l1')])

    await loadAllTasksForCalendar()

    expect(get).toHaveBeenCalledWith('/tasks')
    expect(useTasksStore().allTasks).toHaveLength(1)
  })

  it('retombe sur les listes si /tasks renvoie 404', async () => {
    const lists = useListsStore()
    lists.setLists([list('l1'), list('l2')])
    get
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce([task('t1', 'l1')])
      .mockResolvedValueOnce([task('t2', 'l2')])

    await loadAllTasksForCalendar()

    expect(useTasksStore().allTasks).toHaveLength(2)
  })

  it('charge les listes si le store est vide', async () => {
    get
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce([list('l1')])
      .mockResolvedValueOnce([task('t1', 'l1')])

    await loadAllTasksForCalendar()

    expect(get).toHaveBeenCalledWith('/lists')
    expect(useTasksStore().allTasks).toHaveLength(1)
  })

  it('vide les tâches si chargement des listes échoue', async () => {
    get.mockRejectedValueOnce({ status: 404 }).mockRejectedValueOnce(new Error('lists down'))

    await loadAllTasksForCalendar()

    expect(useTasksStore().allTasks).toHaveLength(0)
  })

  it('propage les erreurs autres que 404', async () => {
    const err = { status: 500 }
    get.mockRejectedValueOnce(err)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await loadAllTasksForCalendar()

    expect(errorSpy).toHaveBeenCalled()
    expect(useTasksStore().allTasks).toHaveLength(0)
    errorSpy.mockRestore()
  })

  it('retourne vide si aucune liste après chargement', async () => {
    get.mockRejectedValueOnce({ status: 404 }).mockResolvedValueOnce([])

    await loadAllTasksForCalendar()

    expect(useTasksStore().allTasks).toHaveLength(0)
  })

  it('ignore les tâches dont la liste est introuvable dans le batch', async () => {
    const lists = useListsStore()
    lists.setLists([list('l1')])
    get
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce([{ ...task('t1', 'unknown'), listId: 'unknown' }])

    await loadAllTasksForCalendar()

    expect(useTasksStore().allTasks[0].list).toBeUndefined()
  })
})
