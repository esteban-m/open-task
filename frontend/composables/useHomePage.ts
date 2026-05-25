import type { TaskList } from '~/stores/lists'

import { isRuntimeClient } from '~/utils/runtime-flags'

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
    async (listId, prev) => {
      if (!listId || listId === prev) return
      switchList(listId, prev ?? null)
      await loadTasksForList(listId)
      const stillVisible = tasksStore.tasks.some((t) => t.id === tasksStore.selectedTaskId)
      if (tasksStore.selectedTaskId && !stillVisible) {
        const inAll = tasksStore.allTasks.some((t) => t.id === tasksStore.selectedTaskId)
        if (!inAll) tasksStore.selectTask(null)
      }
    },
  )

  watch(
    () => listsStore.lists.map((l) => l.id).join(','),
    () => syncListRooms(),
  )
}
