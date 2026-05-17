import type { Task } from '~/stores/tasks'
import type { TaskList } from '~/stores/lists'

const DEFAULT = '#7c6af7'

export function useListColor() {
  const listsStore = useListsStore()

  function colorForListId(listId: string): string {
    return listsStore.lists.find((l) => l.id === listId)?.color || DEFAULT
  }

  function colorForList(list?: Pick<TaskList, 'color'> | null): string {
    return list?.color || DEFAULT
  }

  function colorForTask(task: Task): string {
    return task.list?.color ?? colorForListId(task.listId)
  }

  return { colorForListId, colorForList, colorForTask, DEFAULT }
}
