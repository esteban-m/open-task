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

    const { colorForListId, DEFAULT } = useListColor()
    expect(colorForListId('l1')).toBe('#ff0000')
    expect(colorForListId('missing')).toBe(DEFAULT)
  })
})
