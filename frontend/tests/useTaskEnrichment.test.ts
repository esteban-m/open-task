import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { enrichTasksWithLists } from '~/composables/useTaskEnrichment'
import { useListsStore } from '~/stores/lists'

describe('enrichTasksWithLists', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('attaches list metadata when missing on task', () => {
    const lists = useListsStore()
    lists.setLists([
      {
        id: 'l1',
        name: 'Projets',
        color: '#ff0000',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      },
    ])

    const [enriched] = enrichTasksWithLists([
      {
        id: 't1',
        shortDescription: 'A',
        listId: 'l1',
        completed: false,
        dueDate: '',
        longDescription: null,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
      },
    ])

    expect(enriched.list).toEqual({ id: 'l1', name: 'Projets', color: '#ff0000' })
  })

  it('keeps existing list object on task', () => {
    const lists = useListsStore()
    lists.setLists([
      { id: 'l1', name: 'Projets', userId: 'u1', createdAt: '', updatedAt: '' },
    ])

    const existing = { id: 'l1', name: 'Custom', color: null }
    const [enriched] = enrichTasksWithLists([
      {
        id: 't1',
        shortDescription: 'A',
        listId: 'l1',
        list: existing,
        completed: false,
        dueDate: '',
        longDescription: null,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
      },
    ])

    expect(enriched.list).toBe(existing)
  })

  it('laisse la tâche inchangée si la liste est inconnue', () => {
    const [enriched] = enrichTasksWithLists([
      {
        id: 't1',
        shortDescription: 'A',
        listId: 'missing',
        completed: false,
        dueDate: '',
        longDescription: null,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
      },
    ])
    expect(enriched.list).toBeUndefined()
  })
})
