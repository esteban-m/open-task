/** État partagé du tiroir listes (mobile). */
export function useLeftDrawer() {
  const open = useState<boolean>('layout-left-drawer', () => false)

  function openDrawer() {
    open.value = true
  }

  function closeDrawer() {
    open.value = false
  }

  return { open, openDrawer, closeDrawer }
}
