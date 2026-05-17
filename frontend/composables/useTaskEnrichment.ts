import type { Task } from '~/stores/tasks'

export function enrichTasksWithLists(tasks: Task[]): Task[] {
  const listsStore = useListsStore()
  return tasks.map((task) => {
    const list = listsStore.lists.find((l) => l.id === task.listId)
    if (!list) return task
    return {
      ...task,
      list: task.list ?? {
        id: list.id,
        name: list.name,
        color: list.color ?? null,
      },
    }
  })
}
