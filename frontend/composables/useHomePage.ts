import type { TaskList } from '~/stores/lists'

import { isRuntimeClient } from '~/utils/runtime-flags'

/** Changement de liste sélectionnée (testable + watch). */
export async function handleSelectedListIdChange(
  listId: string | null,
  prev: string | null | undefined,
  ctx: {
    switchList: (listId: string, prev: string | null) => void
    loadTasksForList: (listId: string) => Promise<void>
    tasksStore: ReturnType<typeof useTasksStore>
  },
) {
  if (!listId || listId === prev) return
  ctx.switchList(listId, prev ?? null)
  await ctx.loadTasksForList(listId)
  const stillVisible = ctx.tasksStore.tasks.some((t) => t.id === ctx.tasksStore.selectedTaskId)
  if (ctx.tasksStore.selectedTaskId && !stillVisible) {
    const inAll = ctx.tasksStore.allTasks.some((t) => t.id === ctx.tasksStore.selectedTaskId)
    if (!inAll) ctx.tasksStore.selectTask(null)
  }
}

/** Logique de la page d’accueil (listes, socket, vues calendrier/kanban). */
export function useHomePage() {
  const api = useApi()
  const socket = useSocket()
  const listsStore = useListsStore()
  const tasksStore = useTasksStore()
  const { loadTasksForList, switchList } = useListTasks()
  const { syncListRooms } = useRealtimeSync()

  onMounted(async () => {
    try {
      const lists = await api.get<TaskList[]>('/lists')
      listsStore.setLists(lists)
      syncListRooms()

      if (isRuntimeClient()) {
        const savedId = localStorage.getItem('selectedListId')
        const listId = savedId && lists.some((l) => l.id === savedId) ? savedId : lists[0]?.id
        if (listId) {
          listsStore.selectList(listId)
        }
      }
    } catch (e) {
      console.error('Erreur chargement listes', e)
    }

    await socket.connect()
    syncListRooms()

    const savedView = isRuntimeClient() ? localStorage.getItem('mainContentView') : null
    if (savedView === 'calendar' || savedView === 'kanban') {
      await loadAllTasksForCalendar()
    }
  })

  watch(
    () => listsStore.selectedListId,
    (listId, prev) =>
      handleSelectedListIdChange(listId, prev, {
        switchList,
        loadTasksForList,
        tasksStore,
      }),
  )

  watch(
    () => listsStore.lists.map((l) => l.id).join(','),
    () => syncListRooms(),
  )
}
