import { defineStore } from 'pinia'

export type ListRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface TaskList {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
  color?: string
  myRole?: ListRole | string
  isShared?: boolean
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
      if (!this.lists.find((l) => l.id === list.id)) {
        this.lists.push(list)
      }
    },

    upsertList(list: TaskList) {
      const idx = this.lists.findIndex((l) => l.id === list.id)
      if (idx === -1) {
        this.lists.push(list)
      } else {
        this.lists[idx] = { ...this.lists[idx], ...list }
      }
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
