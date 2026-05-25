import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useListPermission } from '~/composables/useListPermission'
import { useListsStore } from '~/stores/lists'

describe('useListPermission', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allows edit for owner and editor roles', () => {
    const lists = useListsStore()
    lists.setLists([
      {
        id: 'l1',
        name: 'Mine',
        userId: 'u1',
        myRole: 'owner',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'l2',
        name: 'Shared',
        userId: 'u2',
        myRole: 'editor',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'l3',
        name: 'Read',
        userId: 'u2',
        myRole: 'viewer',
        createdAt: '',
        updatedAt: '',
      },
    ])

    const { canEditList, roleForList } = useListPermission()

    expect(canEditList('l1')).toBe(true)
    expect(canEditList('l2')).toBe(true)
    expect(canEditList('l3')).toBe(false)
    expect(roleForList('l2')).toBe('editor')
  })

  it('requireEdit blocks viewers and missing list', () => {
    const lists = useListsStore()
    lists.setLists([
      {
        id: 'l1',
        name: 'Read',
        userId: 'u2',
        myRole: 'viewer',
        createdAt: '',
        updatedAt: '',
      },
    ])

    const { requireEdit } = useListPermission()

    expect(requireEdit(null)).toBe(false)
    expect(requireEdit('l1', 'supprimer')).toBe(false)
    expect(requireEdit('l1')).toBe(false)
  })

  it('normalise les rôles legacy et autorise requireEdit pour owner', () => {
    const lists = useListsStore()
    lists.setLists([
      {
        id: 'l-user',
        name: 'Legacy user',
        userId: 'u1',
        myRole: 'user',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'l-visitor',
        name: 'Visitor',
        userId: 'u1',
        myRole: 'visitor',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'l-owner',
        name: 'Owner',
        userId: 'u1',
        myRole: 'owner',
        createdAt: '',
        updatedAt: '',
      },
    ])

    const { roleForList, requireEdit } = useListPermission()
    expect(roleForList('l-user')).toBe('editor')
    expect(roleForList('l-visitor')).toBe('viewer')
    expect(roleForList('unknown')).toBe('owner')
    expect(requireEdit('l-owner', 'éditer')).toBe(true)
  })
})
