import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { THEME_STORAGE_KEY } from '~/config/themes'
import { toggleMarkdownCheckbox } from '~/composables/useMarkdown'
import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'
import * as runtimeFlags from '~/utils/runtime-flags'

const get = vi.fn()
const connect = vi.fn().mockResolvedValue(undefined)
const socketHandlers: Record<string, (...args: unknown[]) => void> = {}
const syncListRooms = vi.fn()
const loadTasksForList = vi.fn().mockResolvedValue(undefined)
const switchList = vi.fn()
const loadAllTasksForCalendar = vi.fn().mockResolvedValue(undefined)

vi.mock('~/composables/useApi', () => ({ useApi: () => ({ get }) }))
vi.mock('~/composables/useSocket', () => ({
  useSocket: () => ({
    connect,
    on: (event: string, handler: (...args: unknown[]) => void) => {
      socketHandlers[event] = handler
      return () => {
        delete socketHandlers[event]
      }
    },
  }),
}))
vi.mock('~/composables/useListTasks', () => ({
  useListTasks: () => ({ loadTasksForList, switchList }),
}))
vi.mock('~/composables/useRealtimeSync', () => ({
  useRealtimeSync: () => ({ syncListRooms, bind: vi.fn(), unbind: vi.fn() }),
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

describe('codecov runtime branches', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    vi.spyOn(runtimeFlags, 'isRuntimeServer').mockReturnValue(false)
    vi.clearAllMocks()
    get.mockResolvedValue([{ id: 'l1', name: 'Todo', userId: 'u1', createdAt: '', updatedAt: '' }])
    localStorage.clear()
  })

  it('useSessionInit no-op côté serveur', async () => {
    vi.stubGlobal('$fetch', vi.fn())
    const { ensureSession, resetSessionInit } = await import('~/composables/useSessionInit')
    resetSessionInit()
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(false)
    await ensureSession()
    expect($fetch).not.toHaveBeenCalled()
  })

  it('useRealtimeSync bind no-op côté serveur', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeServer').mockReturnValue(true)
    const { useRealtimeSync } = await import('~/composables/useRealtimeSync')
    const { bind, unbind } = useRealtimeSync()
    unbind()
    bind()
  })

  it('useTheme initTheme restaure le thème sauvegardé côté client', () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'ocean')
    const { initTheme, themeId } = useTheme()
    initTheme()
    expect(themeId.value).toBe('abyss')
  })

  it('useTheme initTheme no-op côté serveur', () => {
    localStorage.clear()
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(false)
    const { initTheme, themeId } = useTheme()
    const before = themeId.value
    initTheme()
    expect(themeId.value).toBe(before)
  })

  it('useHomePage charge le calendrier si la vue est sauvegardée', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    localStorage.setItem('mainContentView', 'calendar')
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(loadAllTasksForCalendar).toHaveBeenCalled())
  })

  it('useHomePage logue une erreur de chargement des listes', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    get.mockRejectedValueOnce(new Error('lists down'))
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(errSpy).toHaveBeenCalled())
    errSpy.mockRestore()
  })

  it('useHomePage sans client ni calendrier', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(false)
    await mountSuspended(Harness)
    expect(loadAllTasksForCalendar).not.toHaveBeenCalled()
  })

  it('useHomePage ignore la resélection de la même liste', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(get).toHaveBeenCalled())
    const lists = useListsStore()
    lists.selectList('l1')
    await nextTick()
    switchList.mockClear()
    lists.selectList('l1')
    await nextTick()
    expect(switchList).not.toHaveBeenCalled()
  })

  it('useHomePage garde la tâche sélectionnée si elle reste dans tasks', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(get).toHaveBeenCalled())
    const tasks = useTasksStore()
    const lists = useListsStore()
    tasks.tasks = [
      {
        id: 'in-list',
        listId: 'l1',
        shortDescription: 'Visible',
        longDescription: null,
        dueDate: '',
        completed: false,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    tasks.selectTask('in-list')
    lists.selectList('l1')
    await nextTick()
    lists.selectList('l2')
    await nextTick()
    expect(tasks.selectedTaskId).toBe('in-list')
  })

  it('useHomePage conserve la sélection si la tâche est dans allTasks', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(get).toHaveBeenCalled())
    const tasks = useTasksStore()
    tasks.allTasks = [
      {
        id: 'cal-only',
        listId: 'l1',
        shortDescription: 'Cal',
        longDescription: null,
        dueDate: '',
        completed: false,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    tasks.selectTask('cal-only')
    const lists = useListsStore()
    lists.selectList('l1')
    await nextTick()
    lists.selectList('l2')
    await nextTick()
    expect(tasks.selectedTaskId).toBe('cal-only')
  })

  it('useHomePage désélectionne si tâche absente de allTasks', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeClient').mockReturnValue(true)
    await mountSuspended(Harness)
    await vi.waitFor(() => expect(get).toHaveBeenCalled())
    const tasks = useTasksStore()
    tasks.selectTask('ghost')
    const lists = useListsStore()
    lists.selectList('l1')
    await nextTick()
    lists.selectList('l2')
    await vi.waitFor(() => expect(tasks.selectedTaskId).toBeNull())
  })

  it('toggleMarkdownCheckbox ligne absente', () => {
    expect(toggleMarkdownCheckbox('a\nb', 99)).toBe('a\nb')
    expect(toggleMarkdownCheckbox('', 0)).toBe('')
    expect(toggleMarkdownCheckbox('- [ ] item\n', 1)).toBe('- [ ] item\n')
  })

  it('useRealtimeSync enrichit les tâches sans liste connue', async () => {
    vi.spyOn(runtimeFlags, 'isRuntimeServer').mockReturnValue(false)
    const { useRealtimeSync } = await vi.importActual<typeof import('~/composables/useRealtimeSync')>(
      '~/composables/useRealtimeSync',
    )
    const tasks = useTasksStore()
    const lists = useListsStore()
    tasks.tasks = []
    lists.selectList('unknown')
    const { bind, unbind } = useRealtimeSync()
    unbind()
    bind()
    socketHandlers['task:created']?.({
      id: 't1',
      listId: 'unknown',
      shortDescription: 'Orphan',
      longDescription: null,
      dueDate: '',
      completed: false,
      completedAt: null,
      createdAt: '',
      updatedAt: '',
    })
    expect(tasks.tasks[0]?.shortDescription).toBe('Orphan')
  })
})
