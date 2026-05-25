import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useListColor } from '~/composables/useListColor'
import { useListsStore } from '~/stores/lists'

describe('useListColor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns list color or default', () => {
    const lists = useListsStore()
    lists.setLists([
      {
        id: 'l1',
        name: 'Work',
        userId: 'u1',
        color: '#ff0000',
        createdAt: '',
        updatedAt: '',
      },
    ])

    const { colorForListId, colorForTask, DEFAULT } = useListColor()
    expect(colorForListId('l1')).toBe('#ff0000')
    expect(colorForListId('missing')).toBe(DEFAULT)
    expect(
      colorForTask({
        id: 't2',
        listId: 'l1',
        shortDescription: 'x',
        longDescription: null,
        dueDate: '',
        completed: false,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
      }),
    ).toBe('#ff0000')
  })

  it('colorForList and colorForTask resolve colors', () => {
    const lists = useListsStore()
    lists.setLists([
      {
        id: 'l1',
        name: 'Work',
        userId: 'u1',
        color: '#00ff00',
        createdAt: '',
        updatedAt: '',
      },
    ])

    const { colorForList, colorForTask, DEFAULT } = useListColor()
    expect(colorForList({ color: '#112233' })).toBe('#112233')
    expect(colorForList(null)).toBe(DEFAULT)
    expect(
      colorForTask({
        id: 't1',
        listId: 'l1',
        shortDescription: 'x',
        longDescription: null,
        dueDate: '',
        completed: false,
        completedAt: null,
        createdAt: '',
        updatedAt: '',
        list: { id: 'l1', name: 'W', color: '#aabbcc' },
      }),
    ).toBe('#aabbcc')
  })
})
