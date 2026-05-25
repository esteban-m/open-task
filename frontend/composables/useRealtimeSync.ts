import type { Task } from '~/stores/tasks'
import type { TaskList } from '~/stores/lists'

import { isRuntimeServer } from '~/utils/runtime-flags'

let bound = false
const unsubs: Array<() => void> = []

export function useRealtimeSync() {
  const socket = useSocket()
  const tasksStore = useTasksStore()
  const listsStore = useListsStore()

  function enrichTask(task: Task): Task {
    const list = listsStore.lists.find((l) => l.id === task.listId)
    if (!list) return task
    return {
      ...task,
      list: task.list ?? { id: list.id, name: list.name, color: list.color ?? null },
    }
  }

  function bind() {
    if (bound || isRuntimeServer()) return
    bound = true

    unsubs.push(
      socket.on<Task>('task:created', (task) => {
        tasksStore.addTask(enrichTask(task))
      })
    )

    unsubs.push(
      socket.on<Task>('task:updated', (task) => {
        tasksStore.updateTask(enrichTask(task))
      })
    )

    unsubs.push(
      socket.on<{ task: Task; fromListId: string; toListId: string }>('task:moved', ({ task, fromListId }) => {
        tasksStore.moveTask(enrichTask(task), fromListId)
      })
    )

    unsubs.push(
      socket.on<Task>('task:completed', (task) => {
        tasksStore.updateTask(enrichTask(task))
      })
    )

    unsubs.push(
      socket.on<{ id: string; listId: string }>('task:deleted', ({ id }) => {
        tasksStore.removeTask(id)
      })
    )

    unsubs.push(
      socket.on<TaskList>('list:shared', (list) => {
        listsStore.upsertList(list)
        socket.joinList(list.id)
        if (!listsStore.selectedListId) {
          listsStore.selectList(list.id)
        }
      })
    )

    unsubs.push(
      socket.on<TaskList>('list:updated', (list) => {
        listsStore.updateList(list)
        if (tasksStore.allTasks.length) {
          tasksStore.setAllTasks(enrichTasksWithLists(tasksStore.allTasks))
        }
      })
    )

    unsubs.push(
      socket.on<{ listId: string }>('list:revoked', ({ listId }) => {
        listsStore.removeList(listId)
        socket.leaveList(listId)
        tasksStore.setTasks(tasksStore.tasks.filter((t) => t.listId !== listId))
        tasksStore.setAllTasks(tasksStore.allTasks.filter((t) => t.listId !== listId))
      })
    )

    unsubs.push(
      socket.on<{ listId: string }>('list:deleted', ({ listId }) => {
        listsStore.removeList(listId)
        socket.leaveList(listId)
        tasksStore.setTasks(tasksStore.tasks.filter((t) => t.listId !== listId))
        tasksStore.setAllTasks(tasksStore.allTasks.filter((t) => t.listId !== listId))
      })
    )
  }

  function unbind() {
    unsubs.forEach((fn) => fn())
    unsubs.length = 0
    bound = false
  }

  function syncListRooms() {
    socket.joinLists(listsStore.lists.map((l) => l.id))
  }

  return { bind, unbind, syncListRooms }
}
