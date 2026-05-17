import { defineStore } from 'pinia'

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
}

interface TasksState {
  tasks: Task[]
  selectedTaskId: string | null
  loading: boolean
  completedCollapsed: boolean
}

export const useTasksStore = defineStore('tasks', {
  state: (): TasksState => ({
    tasks: [],
    selectedTaskId: null,
    loading: false,
    completedCollapsed: true,
  }),

  getters: {
    activeTasks: (state) => state.tasks.filter((t) => !t.completed),
    completedTasks: (state) => state.tasks.filter((t) => t.completed),
    selectedTask: (state) =>
      state.tasks.find((t) => t.id === state.selectedTaskId) ?? null,
  },

  actions: {
    setTasks(tasks: Task[]) {
      this.tasks = tasks
    },

    addTask(task: Task) {
      if (!this.tasks.find((t) => t.id === task.id)) {
        this.tasks.push(task)
      }
    },

    updateTask(updated: Task) {
      const idx = this.tasks.findIndex((t) => t.id === updated.id)
      if (idx !== -1) {
        this.tasks[idx] = updated
        // Mettre à jour la sélection si besoin
        if (this.selectedTaskId === updated.id) {
          this.selectedTaskId = updated.id
        }
      }
    },

    removeTask(id: string) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
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
