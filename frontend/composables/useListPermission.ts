import type { ListRole } from '~/stores/lists'

const EDIT_ROLES: ListRole[] = ['owner', 'admin', 'editor']

function normalizeRole(role: string): ListRole | string {
  const r = role?.toLowerCase()
  if (r === 'owner' || r === 'admin' || r === 'editor') return r
  if (r === 'user') return 'editor'
  if (r === 'visitor') return 'viewer'
  return role
}

export function useListPermission() {
  const listsStore = useListsStore()

  function roleForList(listId: string): string {
    const list = listsStore.lists.find((l) => l.id === listId)
    return normalizeRole((list?.myRole as string) || 'owner') as ListRole
  }

  function canEditList(listId: string) {
    return EDIT_ROLES.includes(roleForList(listId) as ListRole)
  }

  /** Affiche un toast si lecture seule ; retourne false pour bloquer l'action. */
  function requireEdit(listId: string | null | undefined, actionLabel = 'modifier'): boolean {
    if (!listId) {
      useToast().warning('Sélectionnez une liste.')
      return false
    }
    if (canEditList(listId)) return true
    useToast().error(`Vous n'avez pas les droits pour ${actionLabel} sur cette liste.`)
    return false
  }

  return { canEditList, roleForList, requireEdit }
}
