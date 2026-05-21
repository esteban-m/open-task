<template>
  <transition name="slide">
    <aside
      v-if="task"
      class="max-md:fixed max-md:inset-0 max-md:z-50 max-md:w-full sm:relative sm:inset-auto w-full sm:w-80 max-w-full flex-shrink-0 bg-surface-1 md:border-l md:border-border flex flex-col overflow-hidden"
    >
      <div class="flex items-center justify-between px-4 py-3 gap-2">
        <span class="text-sm font-medium">Détail</span>
        <div class="flex items-center gap-1">
          <button
            v-if="!editing && task && canEditTask"
            type="button"
            class="text-xs px-2 py-1 rounded text-text-muted hover:text-text hover:bg-surface-2"
            @click="startEdit"
          >
            Modifier
          </button>
          <button
            type="button"
            class="text-text-faint hover:text-text p-1 rounded hover:bg-surface-2"
            title="Fermer"
            @click="close"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div v-if="task.list?.name" class="text-xs text-text-faint">
          Liste : <span class="text-text-muted">{{ task.list.name }}</span>
        </div>

        <div class="flex items-center gap-2">
          <span
            :class="[
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
              task.completed ? 'bg-success-subtle text-success' : 'bg-accent-subtle text-accent',
            ]"
          >
            {{ task.completed ? 'Terminée' : 'Active' }}
          </span>
        </div>

        <template v-if="editing">
          <div>
            <label class="text-xs text-text-faint uppercase tracking-wide mb-1 block">Description</label>
            <input
              v-model="form.shortDescription"
              type="text"
              class="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label class="text-xs text-text-faint uppercase tracking-wide mb-1 block">Notes (Markdown)</label>
            <textarea
              v-model="form.longDescription"
              rows="6"
              placeholder="- [ ] Exemple de checklist&#10;**Gras** et *italique*"
              class="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent resize-none"
            />
            <MarkdownContent
              v-if="form.longDescription.trim()"
              :content="form.longDescription"
              class-name="mt-2 p-2 rounded bg-surface-2/50 border border-border"
            />
          </div>
          <div>
            <label class="text-xs text-text-faint uppercase tracking-wide mb-1 block">Échéance</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            />
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 bg-accent hover:bg-accent-hover text-white text-sm rounded py-2 disabled:opacity-50"
              :disabled="saving || !form.shortDescription.trim()"
              @click="saveEdit"
            >
              {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
            <button type="button" class="px-3 text-sm text-text-muted hover:bg-surface-2 rounded py-2" @click="cancelEdit">
              Annuler
            </button>
          </div>
        </template>

        <template v-else>
          <div>
            <p class="text-xs text-text-faint uppercase tracking-wide mb-1">Description</p>
            <p class="text-sm text-text leading-relaxed">{{ task.shortDescription }}</p>
          </div>
          <div v-if="task.longDescription">
            <p class="text-xs text-text-faint uppercase tracking-wide mb-1">Notes</p>
            <MarkdownContent
              :content="task.longDescription"
              :interactive-checklists="!task.completed"
              :task-id="task.id"
            />
          </div>
          <div class="space-y-2">
            <div>
              <p class="text-xs text-text-faint uppercase tracking-wide mb-0.5">Échéance</p>
              <p :class="['text-sm font-mono', isOverdue ? 'text-danger' : 'text-text-muted']">
                {{ formatDate(task.dueDate) }}
                <span v-if="isOverdue" class="text-xs ml-1">(dépassée)</span>
              </p>
            </div>
            <div>
              <p class="text-xs text-text-faint uppercase tracking-wide mb-0.5">Créée le</p>
              <p class="text-sm font-mono text-text-muted">{{ formatDate(task.createdAt) }}</p>
            </div>
            <div v-if="task.completedAt">
              <p class="text-xs text-text-faint uppercase tracking-wide mb-0.5">Terminée le</p>
              <p class="text-sm font-mono text-success">{{ formatDate(task.completedAt) }}</p>
            </div>
          </div>
        </template>
      </div>

      <div v-if="!editing && canEditTask" class="px-4 py-3 border-t border-border">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 text-danger hover:bg-danger-subtle text-sm rounded py-2"
          @click="confirmDelete = true"
        >
          Supprimer la tâche
        </button>
      </div>
    </aside>
  </transition>

  <ConfirmModal
    v-if="confirmDelete && task"
    title="Supprimer la tâche"
    :message="`Supprimer « ${task.shortDescription} » ?`"
    confirm-label="Supprimer"
    @confirm="deleteTask"
    @cancel="confirmDelete = false"
  />
</template>

<script setup lang="ts">
import ConfirmModal from '~/components/layout/ConfirmModal.vue'
import MarkdownContent from '~/components/common/MarkdownContent.vue'
import type { Task } from '~/stores/tasks'

const tasksStore = useTasksStore()
const api = useApi()
const toast = useToast()
const { requireEdit, canEditList } = useListPermission()

const editing = ref(false)
const saving = ref(false)
const confirmDelete = ref(false)

const form = ref({
  shortDescription: '',
  longDescription: '',
  dueDate: '',
})

const task = computed(() => tasksStore.selectedTask)
const canEditTask = computed(() => (task.value ? canEditList(task.value.listId) : false))

const isOverdue = computed(() => {
  if (!task.value || task.value.completed) return false
  return parseDueDate(task.value.dueDate) < startOfDay(new Date())
})

watch(
  () => task.value?.id,
  () => {
    editing.value = false
  }
)

function formatDate(dateStr: string) {
  return parseDueDate(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toInputDate(iso: string) {
  return dueDateKey(iso) || ''
}

function startEdit() {
  if (!task.value) return
  if (!requireEdit(task.value.listId, 'modifier cette tâche')) return
  form.value = {
    shortDescription: task.value.shortDescription,
    longDescription: task.value.longDescription || '',
    dueDate: toInputDate(task.value.dueDate),
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function close() {
  editing.value = false
  tasksStore.selectTask(null)
}

async function saveEdit() {
  if (!task.value || !form.value.shortDescription.trim()) return
  if (!requireEdit(task.value.listId, 'modifier cette tâche')) return
  saving.value = true
  try {
    const updated = await api.put<Task>(`/tasks/${task.value.id}`, {
      shortDescription: form.value.shortDescription.trim(),
      longDescription: form.value.longDescription.trim() || undefined,
      dueDate: form.value.dueDate,
    })
    tasksStore.updateTask(updated)
    editing.value = false
    toast.success('Tâche mise à jour')
  } catch (e: unknown) {
    toast.fromApiError(e, 'Erreur lors de la mise à jour')
  } finally {
    saving.value = false
  }
}

async function deleteTask() {
  if (!task.value) return
  if (!requireEdit(task.value.listId, 'supprimer cette tâche')) {
    confirmDelete.value = false
    return
  }
  try {
    await api.del(`/tasks/${task.value.id}`)
    tasksStore.removeTask(task.value.id)
    toast.success('Tâche supprimée')
  } catch (e) {
    toast.fromApiError(e)
  } finally {
    confirmDelete.value = false
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: width 0.2s ease, opacity 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  width: 0;
  opacity: 0;
}
</style>
