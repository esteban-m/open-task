import type { Task } from '~/stores/tasks'
import type { TaskList } from '~/stores/lists'

/** Charge toutes les tâches pour le calendrier (agrégation par liste, compatible ancien backend). */
export async function loadAllTasksForCalendar() {
  const api = useApi()
  const listsStore = useListsStore()
  const tasksStore = useTasksStore()

  tasksStore.setAllTasksLoading(true)
  try {
    // Tenter l'endpoint global si le backend est à jour
    try {
      const tasks = await api.get<Task[]>('/tasks')
      tasksStore.setAllTasks(enrichTasksWithLists(tasks))
      return
    } catch (e: unknown) {
      const err = e as { status?: number }
      if (err?.status !== 404) {
        throw e
      }
    }

    await loadAllTasksFromLists(api, listsStore, tasksStore)
  } catch (e) {
    console.error('Erreur chargement calendrier', e)
    tasksStore.setAllTasks([])
  } finally {
    tasksStore.setAllTasksLoading(false)
  }
}

async function loadAllTasksFromLists(
  api: ReturnType<typeof useApi>,
  listsStore: ReturnType<typeof useListsStore>,
  tasksStore: ReturnType<typeof useTasksStore>
) {
  if (!listsStore.lists.length) {
    try {
      const lists = await api.get<TaskList[]>('/lists')
      listsStore.setLists(lists)
    } catch {
      tasksStore.setAllTasks([])
      return
    }
  }

  const lists = listsStore.lists
  if (!lists.length) {
    tasksStore.setAllTasks([])
    return
  }

  const batches = await Promise.all(
    lists.map((list) =>
      api.get<Task[]>(`/lists/${list.id}/tasks`).catch(() => [] as Task[])
    )
  )

  const byId = new Map<string, Task>()
  for (const tasks of batches) {
    for (const task of tasks) {
      const list = lists.find((l) => l.id === task.listId)
      byId.set(
        task.id,
        list
          ? {
              ...task,
              list: {
                id: list.id,
                name: list.name,
                color: list.color ?? null,
              },
            }
          : task
      )
    }
  }

  tasksStore.setAllTasks([...byId.values()])
}
