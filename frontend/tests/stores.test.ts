import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '../stores/auth'
import { useListsStore } from '../stores/lists'
import { useTasksStore } from '../stores/tasks'

describe('Pinia stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('useAuthStore', () => {
    it('tracks token and user', () => {
      const store = useAuthStore()
      store.setToken('tok')
      store.setUser({
        id: 'u1',
        email: 'a@b.fr',
        firstName: 'Jean',
        lastName: 'Dupont',
      })

      expect(store.isAuthenticated).toBe(true)
      expect(store.fullName).toBe('Jean Dupont')
      store.clear()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('useListsStore', () => {
    it('manages list selection and mutations', () => {
      const store = useListsStore()
      const list = {
        id: 'l1',
        name: 'Todo',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      }

      store.setLists([list])
      store.selectList('l1')
      expect(store.selectedList?.id).toBe('l1')

      store.removeList('l1')
      expect(store.lists).toHaveLength(0)
      expect(store.selectedListId).toBeNull()
    })
  })

  describe('useTasksStore', () => {
    it('sets tasks and removes by id', () => {
      const lists = useListsStore()
      lists.selectList('l1')

      const store = useTasksStore()
      const task = {
        id: 't1',
        shortDescription: 'Acheter du lait',
        longDescription: null,
        dueDate: '2026-01-01',
        completed: false,
        completedAt: null,
        listId: 'l1',
        createdAt: '',
        updatedAt: '',
      }

      store.setTasks([task])
      expect(store.tasks).toHaveLength(1)

      store.removeTask('t1')
      expect(store.tasks).toHaveLength(0)
      expect(store.allTasks).toHaveLength(0)
    })

    it('addTask pushes to active list tasks', () => {
      const lists = useListsStore()
      lists.setLists([
        {
          id: 'l1',
          name: 'Todo',
          userId: 'u1',
          createdAt: '',
          updatedAt: '',
        },
      ])
      lists.selectList('l1')

      const store = useTasksStore()
      store.addTask({
        id: 't2',
        shortDescription: 'Nouvelle',
        longDescription: null,
        dueDate: '2026-06-01',
        completed: false,
        completedAt: null,
        listId: 'l1',
        createdAt: '',
        updatedAt: '',
      })

      expect(store.tasks).toHaveLength(1)
      expect(store.allTasks).toHaveLength(1)
    })
  })
})
