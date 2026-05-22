<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex items-center justify-between px-3 py-3 gap-2 flex-shrink-0">
      <h1 v-if="!collapsed" class="text-base font-semibold text-text truncate">Listes</h1>

      <div class="flex items-center gap-1 ml-auto flex-shrink-0">
        <button
          v-if="mobile"
          type="button"
          class="p-1.5 text-text-faint hover:text-text hover:bg-surface-2 rounded transition-colors"
          aria-label="Fermer le menu"
          @click="onCloseDrawer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          v-else
          type="button"
          class="p-1.5 text-text-faint hover:text-text hover:bg-surface-2 rounded transition-colors"
          :title="collapsed ? 'Développer' : 'Réduire'"
          @click="emit('toggle-collapse')"
        >
          <svg
            :class="['w-4 h-4 transition-transform', collapsed ? '' : 'rotate-180']"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="!collapsed" class="px-3 pb-3 flex-shrink-0">
      <button
        type="button"
        data-testid="create-list-btn"
        class="flex items-center justify-center gap-2 w-full bg-surface-2 hover:bg-surface-3 text-text-muted text-xs rounded px-3 py-2 transition-colors"
        @click="showCreateForm = !showCreateForm"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Créer une liste
      </button>

      <div v-if="showCreateForm" class="mt-3 space-y-3">
        <input
          v-model="newListName"
          type="text"
          data-testid="list-name-input"
          placeholder="Nom de la liste"
          class="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
          @keydown.enter="createList"
          @keydown.esc="showCreateForm = false"
        />
        <div>
          <label class="block text-xs text-text-faint mb-1.5">Couleur</label>
          <div class="flex items-center gap-2">
            <input v-model="newListColor" type="color" class="w-8 h-8 bg-surface-2 border border-border rounded cursor-pointer overflow-hidden" />
            <span class="text-xs text-text-muted">{{ newListColor }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            data-testid="list-create-submit"
            :disabled="!newListName.trim()"
            class="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs rounded py-1.5"
            @click="createList"
          >
            Créer
          </button>
          <button type="button" class="px-3 bg-surface-2 hover:bg-surface-3 text-text-muted text-xs rounded py-1.5" @click="showCreateForm = false">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto py-2">
      <div v-if="listsStore.loading" class="flex items-center justify-center py-8">
        <div class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      <template v-else>
        <p v-if="listsStore.lists.length === 0" class="px-4 py-6 text-center text-xs text-text-faint">Aucune liste</p>
        <button
          v-for="list in listsStore.lists"
          :key="list.id"
          type="button"
          :class="[
            'group w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors',
            listsStore.selectedListId === list.id ? 'bg-surface-2' : 'hover:bg-surface-2',
            collapsed ? 'justify-center' : '',
          ]"
          :style="listItemStyle(list)"
          :title="collapsed ? list.name : 'Sélectionner'"
          @click="selectList(list)"
        >
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10" :style="{ backgroundColor: colorForList(list) }" />
          <template v-if="!collapsed">
            <p class="text-sm text-text truncate flex-1 text-left">{{ list.name }}</p>
            <span v-if="list.isShared" class="text-[10px] text-accent flex-shrink-0">partagée</span>
            <span class="text-xs text-text-faint flex-shrink-0">{{ list._count?.tasks || 0 }}</span>
            <div class="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" class="p-1 text-text-faint hover:text-text hover:bg-surface-3 rounded" title="Modifier" @click.stop="emit('edit-list', list)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                data-testid="list-share-btn"
                class="p-1 text-text-faint hover:text-accent hover:bg-accent-subtle rounded"
                title="Partager"
                @click.stop="emit('share-list', list)"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.806 13.328 9 13.086 9 12.85v-1.5c0-.236.193-.478.506-.664L14 8.208l.49.292c.313.186.506.428.506.664v1.5c0 .236.193.478.506.664L20 11.792l-4.256 2.528c-.313.186-.506.428-.506.664v1.5c0 .236-.193.478-.506.664l-5.364 3.186a.948.948 0 01-1.274-.916l.052-1.566a.947.947 0 01.762-1.052l4.098-2.43a.948.948 0 00.665-.807v-1.5c0-.236-.193-.478-.506-.664L8.684 13.342z" />
                </svg>
              </button>
              <button type="button" class="p-1 text-text-faint hover:text-danger hover:bg-danger-subtle rounded" title="Supprimer" @click.stop="emit('delete-list', list)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </template>
        </button>
      </template>
    </div>

    <div class="flex-shrink-0 mt-auto border-t border-border p-3 space-y-1">
      <ThemePicker :collapsed="collapsed" />
      <button
        type="button"
        data-testid="logout-btn"
        :class="[
          'w-full flex items-center gap-2 text-text-muted hover:text-danger hover:bg-danger-subtle rounded px-3 py-2 text-sm transition-colors',
          collapsed ? 'justify-center px-2' : '',
        ]"
        :title="collapsed ? 'Déconnexion' : undefined"
        @click="emit('logout')"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span v-if="!collapsed">Déconnexion</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemePicker from '~/components/ui/ThemePicker.vue'
import type { TaskList as StoreTaskList } from '~/stores/lists'

const props = defineProps<{
  collapsed: boolean
  mobile?: boolean
}>()

const emit = defineEmits<{
  'close-drawer': []
  'toggle-collapse': []
  logout: []
  'edit-list': [list: StoreTaskList]
  'share-list': [list: StoreTaskList]
  'delete-list': [list: StoreTaskList]
}>()

const listsStore = useListsStore()
const api = useApi()
const toast = useToast()
const { colorForList } = useListColor()

const showCreateForm = ref(false)
const newListName = ref('')
const newListColor = ref('#3B82F6')

function listItemStyle(list: StoreTaskList) {
  const c = colorForList(list)
  if (listsStore.selectedListId !== list.id) return {}
  return { borderLeft: `3px solid ${c}`, paddingLeft: '9px' }
}

function onCloseDrawer() {
  emit('close-drawer')
}

function selectList(list: StoreTaskList) {
  listsStore.selectList(list.id)
  if (props.mobile) onCloseDrawer()
}

async function createList() {
  if (!newListName.value.trim()) return
  try {
    const name = newListName.value.trim()
    const color = normalizeHexColor(newListColor.value)
    let list = await api.post<StoreTaskList>('/lists', { name, color }).catch(async (err: { message?: string }) => {
      if (typeof err?.message === 'string' && err.message.includes('color')) {
        return api.post<StoreTaskList>('/lists', { name })
      }
      throw err
    })
    if (!list.color && color) {
      try {
        list = await api.put<StoreTaskList>(`/lists/${list.id}`, { color })
      } catch {
        list = { ...list, color }
      }
    }
    listsStore.addList(list)
    listsStore.selectList(list.id)
    newListName.value = ''
    newListColor.value = '#3B82F6'
    showCreateForm.value = false
    if (props.mobile) emit('close-drawer')
  } catch (e: unknown) {
    toast.fromApiError(e, 'Erreur lors de la création de la liste')
  }
}

function normalizeHexColor(value: string) {
  const v = value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const h = v.slice(1)
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase()
  }
  return '#3b82f6'
}
</script>

<style scoped>
.group:hover .group-hover\\:opacity-100 {
  opacity: 1;
}
</style>
