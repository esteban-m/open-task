<template>
  <div class="mb-3">
    <button
      v-if="!open"
      @click="open = true"
      class="w-full flex items-center gap-2 text-text-faint hover:text-text-muted border border-dashed border-border hover:border-border-subtle rounded px-3 py-2.5 text-sm"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Ajouter une tâche
    </button>

    <div v-else class="bg-surface-1 border border-accent/40 rounded p-3 space-y-3">
      <div>
        <input
          ref="shortDescRef"
          v-model="form.shortDescription"
          type="text"
          placeholder="Description courte *"
          maxlength="200"
          class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2 text-text placeholder-text-faint focus:outline-none focus:border-accent"
          @keyup.enter="submit"
          @keyup.esc="cancel"
        />
      </div>

      <div>
        <textarea
          v-model="form.longDescription"
          placeholder="Notes Markdown : - [ ] tâche, **gras**, listes…"
          rows="3"
          maxlength="2000"
          class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2 text-text placeholder-text-faint focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <div>
        <input
          v-model="form.dueDate"
          type="date"
          class="w-full bg-surface-2 border border-border rounded text-sm px-3 py-2 text-text focus:outline-none focus:border-accent"
          :min="today"
        />
        <p class="text-xs text-text-faint mt-0.5">Date d'échéance *</p>
      </div>

      <div v-if="error" class="text-danger text-xs bg-danger-subtle rounded px-2 py-1.5">
        {{ error }}
      </div>

      <div class="flex gap-2">
        <button
          @click="submit"
          :disabled="loading || !form.shortDescription.trim() || !form.dueDate"
          class="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm rounded py-1.5"
        >
          <span v-if="loading">Ajout…</span>
          <span v-else>Ajouter</span>
        </button>
        <button
          @click="cancel"
          class="px-3 bg-surface-2 hover:bg-surface-3 text-text-muted text-sm rounded py-1.5"
        >
          Annuler
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['created'])

const listsStore = useListsStore()
const tasksStore = useTasksStore()
const api = useApi()
const toast = useToast()
const { requireEdit } = useListPermission()

const open = ref(false)
const loading = ref(false)
const error = ref('')
const shortDescRef = ref<HTMLInputElement | null>(null)

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  shortDescription: '',
  longDescription: '',
  dueDate: '',
})

watch(open, (val) => {
  if (val) nextTick(() => shortDescRef.value?.focus())
})

async function submit() {
  if (!form.shortDescription.trim() || !form.dueDate) return
  if (!listsStore.selectedListId) return
  if (!requireEdit(listsStore.selectedListId, 'ajouter une tâche')) return

  error.value = ''
  loading.value = true

  try {
    const task = await api.post<any>(`/lists/${listsStore.selectedListId}/tasks`, {
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim() || undefined,
      dueDate: form.dueDate,
    })
    tasksStore.addTask(task)
    toast.success('Tâche créée')
    emit('created')
    cancel()
  } catch (e: unknown) {
    error.value = parseApiError(e, 'Erreur lors de la création')
    toast.fromApiError(e, 'Erreur lors de la création')
  } finally {
    loading.value = false
  }
}

function cancel() {
  open.value = false
  form.shortDescription = ''
  form.longDescription = ''
  form.dueDate = ''
  error.value = ''
}
</script>
