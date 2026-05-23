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

    it('updateTask and moveTask keep stores in sync', () => {
      const lists = useListsStore()
      lists.setLists([
        { id: 'l1', name: 'A', userId: 'u1', createdAt: '', updatedAt: '' },
        { id: 'l2', name: 'B', userId: 'u1', createdAt: '', updatedAt: '' },
      ])
      lists.selectList('l1')

      const store = useTasksStore()
      const base = {
        id: 't1',
        shortDescription: 'T',
        longDescription: null,
        dueDate: '2026-01-01',
        completed: false,
        completedAt: null,
        listId: 'l1',
        createdAt: '',
        updatedAt: '',
      }
      store.setTasks([base])
      store.setAllTasks([base])

      store.updateTask({ ...base, shortDescription: 'Updated' })
      expect(store.tasks[0].shortDescription).toBe('Updated')

      store.moveTask({ ...base, listId: 'l2' }, 'l1')
      expect(store.tasks.find((t) => t.id === 't1')).toBeUndefined()
      expect(store.allTasks[0].listId).toBe('l2')
    })

    it('clearTasks et moveTask ajoutent sur liste cible', () => {
      const lists = useListsStore()
      lists.setLists([
        { id: 'l1', name: 'A', userId: 'u1', createdAt: '', updatedAt: '' },
        { id: 'l2', name: 'B', userId: 'u1', createdAt: '', updatedAt: '' },
      ])
      lists.selectList('l2')
      const store = useTasksStore()
      const task = {
        id: 't1',
        shortDescription: 'T',
        longDescription: null,
        dueDate: '2026-01-01',
        completed: false,
        completedAt: null,
        listId: 'l2',
        createdAt: '',
        updatedAt: '',
      }
      store.moveTask(task, 'l1')
      expect(store.tasks.some((t) => t.id === 't1')).toBe(true)
      store.clearTasks()
      expect(store.tasks).toHaveLength(0)
      expect(store.selectedTaskId).toBeNull()
    })

    it('selectedTask cherche dans allTasks et addTask sans liste connue', () => {
      const lists = useListsStore()
      lists.selectList('l1')
      const store = useTasksStore()
      const onlyAll = {
        id: 't-all',
        shortDescription: 'X',
        longDescription: null,
        dueDate: '2026-01-01',
        completed: false,
        completedAt: null,
        listId: 'l1',
        createdAt: '',
        updatedAt: '',
      }
      store.setAllTasks([onlyAll])
      store.selectTask('t-all')
      expect(store.selectedTask?.id).toBe('t-all')
      store.selectTask('introuvable')
      expect(store.selectedTask).toBeNull()

      store.addTask({
        ...onlyAll,
        id: 't-orphan',
        listId: 'l-unknown',
      })
      expect(store.allTasks.some((t) => t.id === 't-orphan')).toBe(true)
    })

    it('updateTask et moveTask couvrent les branches restantes', () => {
      const lists = useListsStore()
      lists.setLists([
        { id: 'l1', name: 'A', userId: 'u1', createdAt: '', updatedAt: '' },
        { id: 'l2', name: 'B', userId: 'u1', createdAt: '', updatedAt: '' },
      ])
      lists.selectList('l1')
      const store = useTasksStore()
      const task = {
        id: 't1',
        shortDescription: 'T',
        longDescription: null,
        dueDate: '2026-01-01',
        completed: false,
        completedAt: null,
        listId: 'l1',
        createdAt: '',
        updatedAt: '',
      }
      store.setTasks([task])
      store.updateTask({ ...task, listId: 'l2' })
      expect(store.tasks.find((t) => t.id === 't1')).toBeUndefined()

      store.setTasks([task])
      store.moveTask({ ...task, shortDescription: 'Moved' }, 'l1')
      expect(store.tasks[0].shortDescription).toBe('Moved')
    })

    it('getters split active and completed tasks', () => {
      const store = useTasksStore()
      store.setTasks([
        {
          id: 't1',
          shortDescription: 'A',
          longDescription: null,
          dueDate: '2026-01-01',
          completed: false,
          completedAt: null,
          listId: 'l1',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 't2',
          shortDescription: 'B',
          longDescription: null,
          dueDate: '2026-01-02',
          completed: true,
          completedAt: '2026-01-02',
          listId: 'l1',
          createdAt: '',
          updatedAt: '',
        },
      ])

      expect(store.activeTasks).toHaveLength(1)
      expect(store.completedTasks).toHaveLength(1)
      store.selectTask('t1')
      expect(store.selectedTask?.id).toBe('t1')
      store.toggleCompletedCollapsed()
      expect(store.completedCollapsed).toBe(false)
    })
  })

  describe('useListsStore extended', () => {
    it('upsertList and updateList mutate lists', () => {
      const store = useListsStore()
      store.upsertList({
        id: 'l1',
        name: 'A',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      })
      store.upsertList({
        id: 'l1',
        name: 'A renamed',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      })
      expect(store.lists).toHaveLength(1)
      expect(store.lists[0].name).toBe('A renamed')

      store.updateList({
        id: 'l1',
        name: 'Final',
        userId: 'u1',
        color: '#abc',
        createdAt: '',
        updatedAt: '',
      })
      expect(store.lists[0].name).toBe('Final')
      store.addList({
        id: 'l2',
        name: 'B',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      })
      expect(store.lists).toHaveLength(2)

      store.setLoading(true)
      expect(store.loading).toBe(true)
      store.setLoading(false)
      expect(store.loading).toBe(false)
    })
  })
})
