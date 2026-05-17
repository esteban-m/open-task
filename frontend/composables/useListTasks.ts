export function useListTasks() {
  const api = useApi()
  const socket = useSocket()
  const tasksStore = useTasksStore()

  async function loadTasksForList(listId: string) {
    tasksStore.setLoading(true)
    try {
      const tasks = await api.get<any[]>(`/lists/${listId}/tasks`)
      tasksStore.setTasks(tasks)
    } catch (e) {
      console.error('Erreur chargement tâches:', e)
      tasksStore.setTasks([])
    } finally {
      tasksStore.setLoading(false)
    }
  }

  function switchList(listId: string, _previousListId: string | null) {
    // Ne pas quitter les rooms : on reste abonné à toutes les listes pour le temps réel
    socket.joinList(listId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedListId', listId)
    }
  }

  return { loadTasksForList, switchList }
}
