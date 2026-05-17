import { defineStore } from 'pinia'

export interface TaskListInfo {
  id: string
  name: string
  color: string | null
}

export interface Task {
  id: string
  shortDescription: string
  longDescription: string | null
  dueDate: string
  completed: boolean
  completedAt: string | null
  listId: string
  createdAt: string
  updatedAt: string
  list?: TaskListInfo
}

interface TasksState {
  tasks: Task[]
  allTasks: Task[]
  selectedTaskId: string | null
  loading: boolean
  allTasksLoading: boolean
  completedCollapsed: boolean
}

export const useTasksStore = defineStore('tasks', {
  state: (): TasksState => ({
    tasks: [],
    allTasks: [],
    selectedTaskId: null,
    loading: false,
    allTasksLoading: false,
    completedCollapsed: true,
  }),

  getters: {
    activeTasks: (state) => state.tasks.filter((t) => !t.completed),
    completedTasks: (state) => state.tasks.filter((t) => t.completed),
    selectedTask: (state) => {
      if (!state.selectedTaskId) return null
      return (
        state.tasks.find((t) => t.id === state.selectedTaskId) ??
        state.allTasks.find((t) => t.id === state.selectedTaskId) ??
        null
      )
    },
  },

  actions: {
    setTasks(tasks: Task[]) {
      this.tasks = tasks
    },

    setAllTasks(tasks: Task[]) {
      this.allTasks = tasks
    },

    setAllTasksLoading(val: boolean) {
      this.allTasksLoading = val
    },

    addTask(task: Task) {
      const listsStore = useListsStore()
      if (listsStore.selectedListId === task.listId && !this.tasks.find((t) => t.id === task.id)) {
        this.tasks.push(task)
      }
      if (!this.allTasks.find((t) => t.id === task.id)) {
        const listsStore = useListsStore()
        const list = listsStore.lists.find((l) => l.id === task.listId)
        this.allTasks.push(
          list
            ? { ...task, list: { id: list.id, name: list.name, color: list.color ?? null } }
            : task
        )
      }
    },

    updateTask(updated: Task) {
      const listsStore = useListsStore()
      const idx = this.tasks.findIndex((t) => t.id === updated.id)
      if (idx !== -1) {
        if (updated.listId !== listsStore.selectedListId) {
          this.tasks.splice(idx, 1)
        } else {
          this.tasks[idx] = { ...this.tasks[idx], ...updated }
        }
      } else if (listsStore.selectedListId === updated.listId) {
        if (!this.tasks.find((t) => t.id === updated.id)) {
          this.tasks.push(updated)
        }
      }
      const allIdx = this.allTasks.findIndex((t) => t.id === updated.id)
      if (allIdx !== -1) {
        this.allTasks[allIdx] = { ...this.allTasks[allIdx], ...updated }
      }
    },

    moveTask(updated: Task, fromListId: string) {
      const listsStore = useListsStore()
      if (fromListId === listsStore.selectedListId && updated.listId !== fromListId) {
        this.tasks = this.tasks.filter((t) => t.id !== updated.id)
      }
      if (updated.listId === listsStore.selectedListId) {
        const idx = this.tasks.findIndex((t) => t.id === updated.id)
        if (idx === -1) this.tasks.push(updated)
        else this.tasks[idx] = updated
      }
      const allIdx = this.allTasks.findIndex((t) => t.id === updated.id)
      if (allIdx !== -1) {
        this.allTasks[allIdx] = { ...this.allTasks[allIdx], ...updated }
      } else {
        this.allTasks.push(updated)
      }
    },

    removeTask(id: string) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
      this.allTasks = this.allTasks.filter((t) => t.id !== id)
      if (this.selectedTaskId === id) this.selectedTaskId = null
    },

    selectTask(id: string | null) {
      this.selectedTaskId = id
    },

    clearTasks() {
      this.tasks = []
      this.selectedTaskId = null
    },

    setLoading(val: boolean) {
      this.loading = val
    },

    toggleCompletedCollapsed() {
      this.completedCollapsed = !this.completedCollapsed
    },
  },
})
