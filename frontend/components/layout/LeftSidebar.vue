<template>
  <!-- Desktop uniquement -->
  <aside
    class="left-sidebar-desktop hidden md:flex h-full flex-col flex-shrink-0 bg-surface-1 overflow-hidden transition-[width] duration-200"
    :class="isCollapsed ? 'w-16' : 'w-72'"
  >
    <SidebarPanel
      :collapsed="isCollapsed"
      @toggle-collapse="isCollapsed = !isCollapsed"
      @logout="logout"
      @edit-list="editListModal = { ...$event }"
      @share-list="shareListModal = { listId: $event.id, listName: $event.name }"
      @delete-list="confirmDeleteList = $event"
    />
  </aside>

  <!-- Mobile : tiroir (rien n'est rendu si fermé) -->
  <Teleport to="body">
    <div
      v-if="drawerOpen"
      class="left-drawer-mobile fixed inset-0 z-[100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu des listes"
    >
      <button
        type="button"
        class="absolute inset-0 w-full h-full bg-black/50 border-0 p-0 cursor-pointer"
        aria-label="Fermer le menu"
        @click="closeDrawer"
      />
      <aside
        class="absolute inset-y-0 left-0 z-[101] w-[min(100vw-1.5rem,18rem)] h-full flex flex-col bg-surface-1 shadow-xl"
      >
        <SidebarPanel
          :collapsed="false"
          mobile
          @close-drawer="closeDrawer"
          @logout="logout"
          @edit-list="editListModal = { ...$event }"
          @share-list="shareListModal = { listId: $event.id, listName: $event.name }"
          @delete-list="confirmDeleteList = $event"
        />
      </aside>
    </div>
  </Teleport>

  <ConfirmModal
    v-if="confirmDeleteList"
    title="Supprimer la liste"
    :message="`Supprimer « ${confirmDeleteList.name} » ? Toutes les tâches seront perdues.`"
    confirm-label="Supprimer"
    @confirm="confirmDelete"
    @cancel="confirmDeleteList = null"
  />

  <ListEditModal
    v-if="editListModal"
    :list="editListModal"
    @close="editListModal = null"
    @saved="onListSaved"
  />

  <ListShareModal
    v-if="shareListModal.listId"
    :list-id="shareListModal.listId"
    :list-name="shareListModal.listName || ''"
    :visible="!!shareListModal.listId"
    @close="shareListModal = { listId: null, listName: null }"
    @refresh="refreshLists"
  />
</template>

<script setup lang="ts">
import ConfirmModal from '~/components/layout/ConfirmModal.vue'
import ListShareModal from '~/components/lists/ListShareModal.vue'
import ListEditModal from '~/components/lists/ListEditModal.vue'
import SidebarPanel from '~/components/layout/SidebarPanel.vue'
import type { TaskList as StoreTaskList } from '~/stores/lists'

const { open: drawerOpen, closeDrawer } = useLeftDrawer()
const listsStore = useListsStore()
const api = useApi()
const toast = useToast()
const socket = useSocket()
const auth = useAuth()
const router = useRouter()
const tasksStore = useTasksStore()

const isCollapsed = ref(false)
const confirmDeleteList = ref<StoreTaskList | null>(null)
const shareListModal = ref<{ listId: string | null; listName: string | null }>({ listId: null, listName: null })
const editListModal = ref<StoreTaskList | null>(null)

const { syncListRooms, unbind: unbindRealtime } = useRealtimeSync()

async function refreshLists() {
  try {
    const lists = await api.get<StoreTaskList[]>('/lists')
    listsStore.setLists(lists)
    syncListRooms()
  } catch (e) {
    console.error('Erreurchargement listes:', e)
  }
}

async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {
    /* ignore */
  }
  unbindRealtime()
  socket.disconnect()
  auth.clear()
  closeDrawer()
  router.push('/login')
}

function onListSaved(updated: StoreTaskList) {
  listsStore.updateList(updated)
  if (viewModeUsesCalendar()) {
    tasksStore.setAllTasks(enrichTasksWithLists(tasksStore.allTasks))
  }
}

function viewModeUsesCalendar() {
  return typeof window !== 'undefined' && localStorage.getItem('mainContentView') === 'calendar'
}

async function confirmDelete() {
  const list = confirmDeleteList.value
  if (!list) return
  try {
    await api.del(`/lists/${list.id}`)
    listsStore.removeList(list.id)
  } catch (e) {
    toast.fromApiError(e)
  } finally {
    confirmDeleteList.value = null
  }
}

onMounted(async () => {
  closeDrawer()
  await refreshLists()
})
</script>

<style scoped>
@media (max-width: 767px) {
  .left-sidebar-desktop {
    display: none !important;
  }
}
</style>
