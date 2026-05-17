<template>
  <!-- Sidebar rétractable -->
  <aside
    :class="[
      'flex flex-col bg-surface-1 border-r border-border transition-all duration-200 ease-in-out flex-shrink-0',
      collapsed ? 'w-12' : 'w-56',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-3 border-b border-border min-h-[52px]">
      <div v-if="!collapsed" class="flex items-center gap-2 min-w-0">
        <span class="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">OT</span>
        <span class="text-sm font-semibold truncate">Open-Task</span>
      </div>
      <button
        @click="collapsed = !collapsed"
        class="text-text-faint hover:text-text p-1 rounded hover:bg-surface-3 flex-shrink-0"
        :title="collapsed ? 'Déplier le panneau' : 'Replier le panneau'"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path v-if="!collapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Bouton nouvelle liste -->
    <div class="px-2 py-2 border-b border-border">
      <button
        v-if="!collapsed"
        @click="showNewListInput = true"
        class="w-full flex items-center gap-2 text-text-muted hover:text-text hover:bg-surface-2 px-2 py-1.5 rounded text-sm"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle liste
      </button>
      <button
        v-else
        @click="collapsed = false; showNewListInput = true"
        class="w-full flex items-center justify-center text-text-faint hover:text-accent p-1.5 rounded hover:bg-surface-2"
        title="Nouvelle liste"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- Input nouvelle liste -->
    <div v-if="showNewListInput && !collapsed" class="px-2 py-2 border-b border-border">
      <input
        ref="newListInputRef"
        v-model="newListName"
        type="text"
        placeholder="Nom de la liste"
        maxlength="100"
        class="w-full bg-surface-2 border border-accent rounded text-xs px-2 py-1.5 text-text placeholder-text-faint focus:outline-none"
        @keyup.enter="createList"
        @keyup.esc="cancelNewList"
      />
      <div class="flex gap-1 mt-1.5">
        <button @click="createList" :disabled="!newListName.trim()" class="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs rounded py-1">
          Créer
        </button>
        <button @click="cancelNewList" class="flex-1 bg-surface-3 hover:bg-surface-4 text-text-muted text-xs rounded py-1">
          Annuler
        </button>
      </div>
      <p v-if="createError" class="text-danger text-xs mt-1">{{ createError }}</p>
    </div>

    <!-- Liste des listes -->
    <nav class="flex-1 overflow-y-auto py-1">
      <div
        v-for="list in listsStore.lists"
        :key="list.id"
        :class="[
          'group flex items-center gap-2 cursor-pointer rounded mx-1 my-0.5',
          collapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5',
          listsStore.selectedListId === list.id
            ? 'bg-accent-subtle text-accent'
            : 'text-text-muted hover:text-text hover:bg-surface-2',
        ]"
        @click="selectList(list.id)"
        :title="collapsed ? list.name : undefined"
      >
        <!-- Icône liste -->
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>

        <template v-if="!collapsed">
          <span class="flex-1 text-sm truncate">{{ list.name }}</span>
          <!-- Bouton suppression (visible au hover) -->
          <button
            @click.stop="confirmDeleteList(list)"
            class="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger p-0.5 rounded"
            title="Supprimer la liste"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </template>
      </div>

      <div v-if="listsStore.lists.length === 0 && !collapsed" class="px-3 py-4 text-text-faint text-xs text-center">
        Aucune liste pour l'instant
      </div>
    </nav>

    <!-- Bas de sidebar : utilisateur + déconnexion -->
    <div class="border-t border-border px-2 py-2">
      <div v-if="!collapsed" class="flex items-center gap-2 px-2 py-1.5">
        <div class="w-6 h-6 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-xs font-medium flex-shrink-0">
          {{ initials }}
        </div>
        <span class="flex-1 text-xs text-text-muted truncate">{{ authStore.fullName }}</span>
        <button @click="logout" class="text-text-faint hover:text-danger p-0.5 rounded" title="Déconnexion">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
      <button v-else @click="logout" class="w-full flex justify-center text-text-faint hover:text-danger p-1.5 rounded" title="Déconnexion">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  </aside>

  <!-- Modale de confirmation de suppression -->
  <ConfirmModal
    v-if="listToDelete"
    title="Supprimer la liste"
    :message="`Supprimer &quot;${listToDelete.name}&quot; supprimera également toutes les tâches associées. Cette action est irréversible.`"
    confirm-label="Supprimer"
    @confirm="deleteList"
    @cancel="listToDelete = null"
  />
</template>

<script setup lang="ts">
import type { TaskList } from '~/stores/lists'

const authStore = useAuthStore()
const listsStore = useListsStore()
const tasksStore = useTasksStore()
const api = useApi()
const socket = useSocket()
const router = useRouter()

const collapsed = ref(false)
const showNewListInput = ref(false)
const newListName = ref('')
const createError = ref('')
const listToDelete = ref<TaskList | null>(null)
const newListInputRef = ref<HTMLInputElement | null>(null)

const initials = computed(() => {
  const u = authStore.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})

watch(showNewListInput, (val) => {
  if (val) {
    nextTick(() => newListInputRef.value?.focus())
  }
})

async function createList() {
  if (!newListName.value.trim()) return
  createError.value = ''
  try {
    const list = await api.post<TaskList>('/lists', { name: newListName.value.trim() })
    listsStore.addList(list)
    cancelNewList()
  } catch (e: any) {
    createError.value = e.message || 'Erreur lors de la création'
  }
}

function cancelNewList() {
  showNewListInput.value = false
  newListName.value = ''
  createError.value = ''
}

async function selectList(id: string) {
  const prev = listsStore.selectedListId
  if (prev) socket.leaveList(prev)

  listsStore.selectList(id)
  tasksStore.clearTasks()
  tasksStore.setLoading(true)

  socket.joinList(id)

  try {
    const tasks = await api.get<any[]>(`/lists/${id}/tasks`)
    tasksStore.setTasks(tasks)
  } catch (e) {
    console.error('Erreur chargement tâches', e)
  } finally {
    tasksStore.setLoading(false)
  }
}

function confirmDeleteList(list: TaskList) {
  listToDelete.value = list
}

async function deleteList() {
  if (!listToDelete.value) return
  try {
    await api.del(`/lists/${listToDelete.value.id}`)
    listsStore.removeList(listToDelete.value.id)
    tasksStore.clearTasks()
  } catch (e: any) {
    console.error(e)
  } finally {
    listToDelete.value = null
  }
}

async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    authStore.clear()
    listsStore.selectList(null)
    tasksStore.clearTasks()
    socket.disconnect()
    router.push('/login')
  }
}
</script>
