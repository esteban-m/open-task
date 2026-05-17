import { defineStore } from 'pinia'

export interface TaskList {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: { tasks: number }
}

interface ListsState {
  lists: TaskList[]
  selectedListId: string | null
  loading: boolean
}

export const useListsStore = defineStore('lists', {
  state: (): ListsState => ({
    lists: [],
    selectedListId: null,
    loading: false,
  }),

  getters: {
    selectedList: (state) =>
      state.lists.find((l) => l.id === state.selectedListId) ?? null,
  },

  actions: {
    setLists(lists: TaskList[]) {
      this.lists = lists
    },

    addList(list: TaskList) {
      this.lists.push(list)
    },

    updateList(updated: TaskList) {
      const idx = this.lists.findIndex((l) => l.id === updated.id)
      if (idx !== -1) this.lists[idx] = updated
    },

    removeList(id: string) {
      this.lists = this.lists.filter((l) => l.id !== id)
      if (this.selectedListId === id) this.selectedListId = null
    },

    selectList(id: string | null) {
      this.selectedListId = id
    },

    setLoading(val: boolean) {
      this.loading = val
    },
  },
})
