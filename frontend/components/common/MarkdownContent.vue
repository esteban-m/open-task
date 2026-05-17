<template>
  <div
    v-if="html"
    :class="['markdown-body', compact ? 'markdown-body--compact' : '', className]"
    v-html="html"
    @click="onClick"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    content?: string | null
    compact?: boolean
    className?: string
    interactiveChecklists?: boolean
    taskId?: string
  }>(),
  {
    content: '',
    compact: false,
    className: '',
    interactiveChecklists: false,
    taskId: undefined,
  }
)

const emit = defineEmits<{
  (e: 'update:content', value: string): void
}>()

const api = useApi()
const toast = useToast()
const { requireEdit } = useListPermission()
const tasksStore = useTasksStore()

const html = computed(() => renderMarkdown(props.content))

async function onClick(e: MouseEvent) {
  if (!props.interactiveChecklists || !props.taskId || !props.content) return
  const task =
    tasksStore.selectedTask ??
    tasksStore.allTasks.find((t) => t.id === props.taskId) ??
    tasksStore.tasks.find((t) => t.id === props.taskId)
  if (!task || !requireEdit(task.listId, 'modifier cette checklist')) return
  const input = e.target as HTMLElement
  if (input.tagName !== 'INPUT' || (input as HTMLInputElement).type !== 'checkbox') return
  e.preventDefault()

  const root = e.currentTarget as HTMLElement
  const boxes = [...root.querySelectorAll('input[type="checkbox"]')]
  const index = boxes.indexOf(input as HTMLInputElement)
  if (index < 0) return

  const lines = props.content.split('\n')
  let count = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*-\s*\[[ xX]\]\s/.test(lines[i])) {
      if (count === index) {
        const updatedMd = toggleMarkdownCheckbox(props.content, i)
        emit('update:content', updatedMd)
        try {
          const existing =
            tasksStore.selectedTask ??
            tasksStore.allTasks.find((t) => t.id === props.taskId) ??
            tasksStore.tasks.find((t) => t.id === props.taskId)
          if (existing) {
            const updated = await api.put<typeof existing>(`/tasks/${props.taskId}`, {
              longDescription: updatedMd,
            })
            tasksStore.updateTask(updated)
          }
        } catch (err) {
          toast.fromApiError(err)
        }
        return
      }
      count++
    }
  }
}
</script>
