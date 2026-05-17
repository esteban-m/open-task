<template>
  <!-- Panneau de détail, visible uniquement si une tâche est sélectionnée -->
  <transition name="slide">
    <aside
      v-if="tasksStore.selectedTask"
      class="w-72 flex-shrink-0 bg-surface-1 border-l border-border flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <span class="text-sm font-medium">Détail</span>
        <button
          @click="tasksStore.selectTask(null)"
          class="text-text-faint hover:text-text p-1 rounded hover:bg-surface-2"
          title="Fermer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Contenu -->
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <!-- Statut -->
        <div class="flex items-center gap-2">
          <span
            :class="[
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
              task.completed
                ? 'bg-success-subtle text-success'
                : 'bg-accent-subtle text-accent',
            ]"
          >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            {{ task.completed ? 'Terminée' : 'Active' }}
          </span>
        </div>

        <!-- Description courte -->
        <div>
          <p class="text-xs text-text-faint uppercase tracking-wide mb-1">Description</p>
          <p class="text-sm text-text leading-relaxed">{{ task.shortDescription }}</p>
        </div>

        <!-- Description longue -->
        <div v-if="task.longDescription">
          <p class="text-xs text-text-faint uppercase tracking-wide mb-1">Notes</p>
          <p class="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{{ task.longDescription }}</p>
        </div>

        <!-- Dates -->
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
      </div>

      <!-- Actions -->
      <div class="px-4 py-3 border-t border-border space-y-2">
        <button
          @click="confirmDelete = true"
          class="w-full flex items-center justify-center gap-2 text-danger hover:bg-danger-subtle text-sm rounded py-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Supprimer la tâche
        </button>
      </div>
    </aside>
  </transition>

  <!-- Modale de confirmation -->
  <ConfirmModal
    v-if="confirmDelete && task"
    title="Supprimer la tâche"
    :message="`Supprimer &quot;${task.shortDescription}&quot; ? Cette action est irréversible.`"
    confirm-label="Supprimer"
    @confirm="deleteTask"
    @cancel="confirmDelete = false"
  />
</template>

<script setup lang="ts">
const tasksStore = useTasksStore()
const api = useApi()
const confirmDelete = ref(false)

const task = computed(() => tasksStore.selectedTask!)

const isOverdue = computed(() => {
  if (!task.value || task.value.completed) return false
  return new Date(task.value.dueDate) < new Date()
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function deleteTask() {
  if (!task.value) return
  try {
    await api.del(`/tasks/${task.value.id}`)
    // Le WebSocket met à jour le store, mais on le fait aussi localement en cas de latence
    tasksStore.removeTask(task.value.id)
  } catch (e) {
    console.error(e)
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
