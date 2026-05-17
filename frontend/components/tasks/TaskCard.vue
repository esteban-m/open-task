<template>
  <div
    :class="[
      'group flex items-start gap-3 px-3 py-2.5 rounded cursor-pointer border border-l-[3px]',
      isSelected
        ? 'bg-accent-subtle border-accent/30'
        : 'bg-surface-1 border-border hover:border-border hover:bg-surface-2',
      task.completed ? 'opacity-60' : '',
    ]"
    :style="{ borderLeftColor: listColor }"
    @click="tasksStore.selectTask(task.id)"
  >
    <!-- Checkbox -->
    <button
      @click.stop="toggleComplete"
      :class="[
        'mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
        task.completed
          ? 'bg-success border-success'
          : 'border-border hover:border-accent',
      ]"
      :title="task.completed ? 'Remettre dans les actives' : 'Marquer comme terminée'"
    >
      <svg v-if="task.completed" class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Contenu -->
    <div class="flex-1 min-w-0">
      <p
        :class="[
          'text-sm leading-snug',
          task.completed ? 'line-through text-text-faint' : 'text-text',
        ]"
      >
        {{ task.shortDescription }}
      </p>
      <div class="flex items-center gap-2 mt-1">
        <span
          :class="[
            'text-xs font-mono',
            isOverdue && !task.completed ? 'text-danger' : 'text-text-faint',
          ]"
        >
          {{ formatDate(task.dueDate) }}
        </span>
      </div>
      <MarkdownContent
        v-if="task.longDescription"
        :content="task.longDescription"
        compact
        class-name="mt-2"
        :interactive-checklists="!task.completed"
        :task-id="task.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/stores/tasks'
import MarkdownContent from '~/components/common/MarkdownContent.vue'

const props = defineProps<{ task: Task }>()

const tasksStore = useTasksStore()
const api = useApi()
const toast = useToast()
const { requireEdit } = useListPermission()
const { colorForTask } = useListColor()

const isSelected = computed(() => tasksStore.selectedTaskId === props.task.id)
const listColor = computed(() => colorForTask(props.task))

const isOverdue = computed(() => parseDueDate(props.task.dueDate) < startOfDay(new Date()))

function formatDate(d: string) {
  return parseDueDate(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

async function toggleComplete() {
  if (!requireEdit(props.task.listId, 'modifier cette tâche')) return
  try {
    const updated = await api.patch<any>(`/tasks/${props.task.id}/toggle`)
    tasksStore.updateTask(updated)
  } catch (e) {
    toast.fromApiError(e)
  }
}
</script>
