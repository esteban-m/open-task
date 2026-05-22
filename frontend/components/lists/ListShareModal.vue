<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="bg-surface-1 border border-border rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
        <div class="px-5 pt-5 pb-3">
          <h2 class="text-lg font-semibold text-text">Partager la liste</h2>
          <p class="text-text-muted text-sm mt-1">{{ listName }}</p>
        </div>

        <div class="p-5 overflow-y-auto space-y-5">
          <div class="space-y-2">
            <label class="block text-xs font-medium text-text-faint uppercase">Inviter par email</label>
            <input
              v-model="newEmail"
              type="email"
              data-testid="share-email-input"
              placeholder="collegue@exemple.com"
              class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              @keydown.enter="shareWithEmail"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-medium text-text-faint uppercase">Rôle</label>
            <select
              v-model="newRole"
              data-testid="share-role-select"
              class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="viewer">Lecture seule (viewer)</option>
              <option value="editor">Écriture (editor)</option>
              <option value="admin">Administration (admin)</option>
            </select>
            <p class="text-[11px] text-text-faint leading-relaxed">
              <strong>Viewer</strong> : consulter les tâches.
              <strong>Editor</strong> : créer et modifier.
              <strong>Admin</strong> : gérer le partage et la liste.
            </p>
          </div>

          <button
            type="button"
            data-testid="share-submit"
            class="w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg py-2 disabled:opacity-50"
            :disabled="!newEmail.trim() || sharing"
            @click="shareWithEmail"
          >
            {{ sharing ? 'Envoi…' : 'Partager' }}
          </button>

          <div class="space-y-2 pt-2 border-t border-border">
            <h3 class="text-xs font-medium text-text-faint uppercase">Accès actuels</h3>
            <div v-if="loading" class="text-sm text-text-faint text-center py-4">Chargement…</div>
            <div v-else-if="sharedUsers.length === 0" class="text-sm text-text-faint text-center py-4">
              Aucun collaborateur
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="user in sharedUsers"
                :key="user.id"
                class="flex items-center justify-between bg-surface-2/50 px-3 py-2 rounded-lg"
              >
                <div>
                  <span class="text-sm text-text">{{ user.email }}</span>
                  <span class="block text-[11px] text-text-faint">{{ roleLabel(user.role) }}</span>
                </div>
                <button
                  type="button"
                  class="text-xs text-danger hover:bg-danger-subtle px-2 py-1 rounded"
                  @click="revokeAccess(user.id)"
                >
                  Révoquer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 pb-5 border-t border-border pt-3">
          <button
            type="button"
            data-testid="share-modal-close"
            class="w-full bg-surface-2 hover:bg-surface-3 text-text-muted text-sm rounded-lg py-2"
            @click="emit('close')"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
type ShareRole = 'viewer' | 'editor' | 'admin'

interface SharedUser {
  id: string
  email: string
  role: string
}

const props = defineProps<{
  listId: string
  listName: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const api = useApi()
const toast = useToast()
const newEmail = ref('')
const newRole = ref<ShareRole>('editor')
const sharedUsers = ref<SharedUser[]>([])
const loading = ref(false)
const sharing = ref(false)

const roleLabels: Record<string, string> = {
  viewer: 'Lecture seule',
  editor: 'Écriture',
  admin: 'Administration',
  VISITOR: 'Lecture seule',
  USER: 'Écriture',
  ADMIN: 'Administration',
}

function roleLabel(role: string) {
  return roleLabels[role] ?? role
}

async function fetchSharedUsers() {
  if (!props.listId) return
  loading.value = true
  try {
    sharedUsers.value = await api.get<SharedUser[]>(`/lists/${props.listId}/shared-users`)
  } catch {
    sharedUsers.value = []
  } finally {
    loading.value = false
  }
}

async function shareWithEmail() {
  if (!props.listId || !newEmail.value.trim()) return
  sharing.value = true
  try {
    await api.post(`/lists/${props.listId}/share`, {
      invitedEmail: newEmail.value.trim(),
      role: newRole.value,
    })
    newEmail.value = ''
    await fetchSharedUsers()
    toast.success('Liste partagée')
    emit('refresh')
  } catch (e: unknown) {
    toast.fromApiError(e, 'Impossible de partager cette liste')
  } finally {
    sharing.value = false
  }
}

async function revokeAccess(userId: string) {
  if (!props.listId) return
  try {
    await api.del(`/lists/${props.listId}/share/${userId}`)
    sharedUsers.value = sharedUsers.value.filter((u) => u.id !== userId)
    toast.success('Accès révoqué')
    emit('refresh')
  } catch (e: unknown) {
    toast.fromApiError(e, 'Erreur lors de la révocation')
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchSharedUsers()
    }
  },
  { immediate: true }
)
</script>
