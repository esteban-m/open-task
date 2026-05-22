<template>
  <div class="flex flex-1 min-h-0 flex-col">
    <p v-if="!listsStore.lists.length" class="text-sm text-text-faint text-center py-12">
      Aucune liste — créez-en une dans la barre latérale
    </p>

    <div
      v-else
      class="flex flex-1 min-h-0 gap-4 overflow-x-auto overflow-y-hidden pb-4 -mx-1 px-1"
    >
      <div
        v-for="list in listsStore.lists"
        :key="list.id"
        :data-testid="`kanban-column-${list.id}`"
        class="flex flex-col w-72 flex-shrink-0 rounded-xl border border-border bg-surface-1/80 max-h-full"
        :class="dropTargetListId === list.id && 'ring-2 ring-accent/50'"
        @dragover.prevent="onDragOver(list.id)"
        @dragleave="onDragLeave(list.id)"
        @drop.prevent="onDrop(list.id)"
      >
        <div
          class="flex items-center gap-2 px-3 py-3 flex-shrink-0 rounded-t-xl"
          :style="{ borderTopColor: colorForList(list), borderTopWidth: '3px' }"
        >
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: colorForList(list) }" />
          <h3 class="text-sm font-semibold text-text truncate flex-1">{{ list.name }}</h3>
          <span class="text-xs text-text-faint">{{ columnTasks(list.id).length }}</span>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
          <div
            v-for="task in columnTasks(list.id)"
            :key="task.id"
            draggable="true"
            :data-testid="`kanban-task-${task.id}`"
            :data-kanban-list-id="list.id"
            class="rounded-lg border border-border bg-surface-2 p-2.5 cursor-grab active:cursor-grabbing hover:border-border-subtle transition-shadow"
            :class="[
              draggingTaskId === task.id && 'opacity-50',
              !canEditList(list.id) && 'cursor-default',
              tasksStore.selectedTaskId === task.id && 'ring-1 ring-accent/40',
            ]"
            :style="{ borderLeftWidth: '3px', borderLeftColor: colorForList(list) }"
            @dragstart="onDragStart($event, task)"
            @dragend="onDragEnd"
            @click="openTask(task)"
          >
            <div class="flex items-start gap-2">
              <button
                type="button"
                class="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                :class="task.completed ? 'bg-success border-success' : 'border-border hover:border-accent'"
                @click.stop="toggleComplete(task)"
              >
                <svg v-if="task.completed" class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <div class="flex-1 min-w-0">
                <p :class="['text-sm font-medium leading-snug', task.completed && 'line-through text-text-faint']">
                  {{ task.shortDescription }}
                </p>
                <p class="text-[10px] font-mono text-text-faint mt-1">{{ formatDue(task.dueDate) }}</p>
                <MarkdownContent
                  v-if="task.longDescription"
                  :content="task.longDescription"
                  compact
                  class-name="mt-2 line-clamp-3"
                />
              </div>
            </div>
          </div>

          <p v-if="!columnTasks(list.id).length" class="text-xs text-text-faint text-center py-6 pointer-events-none">
            Glissez une tâche ici
          </p>
        </div>

        <div v-if="completedByList(list.id).length" class="border-t border-border p-2 flex-shrink-0">
          <button
            type="button"
            class="text-[11px] text-text-faint hover:text-text-muted w-full text-left px-1"
            @click="toggleCompletedColumn(list.id)"
          >
            Terminées ({{ completedByList(list.id).length }})
            <span>{{ expandedCompleted[list.id] ? '▾' : '▸' }}</span>
          </button>
          <div v-if="expandedCompleted[list.id]" class="mt-2 space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="task in completedByList(list.id)"
              :key="task.id"
              class="rounded-lg border border-border/60 bg-surface-2/50 p-2 opacity-60 text-xs"
              @click="openTask(task)"
            >
              <p class="line-through truncate">{{ task.shortDescription }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/stores/tasks'
import MarkdownContent from '~/components/common/MarkdownContent.vue'

const listsStore = useListsStore()
const tasksStore = useTasksStore()
const api = useApi()
const { colorForList } = useListColor()
const toast = useToast()
const { canEditList, requireEdit } = useListPermission()

const draggingTaskId = ref<string | null>(null)
const dragTask = ref<Task | null>(null)
const dropTargetListId = ref<string | null>(null)
const expandedCompleted = ref<Record<string, boolean>>({})

const tasksByList = computed(() => {
  const map = new Map<string, Task[]>()
  for (const list of listsStore.lists) {
    map.set(list.id, [])
  }
  for (const task of tasksStore.allTasks) {
    if (!map.has(task.listId)) map.set(task.listId, [])
    map.get(task.listId)!.push(task)
  }
  return map
})

function columnTasks(listId: string) {
  return (tasksByList.value.get(listId) ?? []).filter((t) => !t.completed)
}

function completedByList(listId: string) {
  return (tasksByList.value.get(listId) ?? []).filter((t) => t.completed)
}

function formatDue(d: string) {
  return parseDueDate(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function toggleCompletedColumn(listId: string) {
  expandedCompleted.value[listId] = !expandedCompleted.value[listId]
}

function onDragStart(e: DragEvent, task: Task) {
  if (!canEditList(task.listId)) {
    e.preventDefault()
    return
  }
  draggingTaskId.value = task.id
  dragTask.value = task
  e.dataTransfer?.setData('text/plain', task.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  draggingTaskId.value = null
  dragTask.value = null
  dropTargetListId.value = null
}

function onDragOver(listId: string) {
  if (dragTask.value && canEditList(listId)) {
    dropTargetListId.value = listId
  }
}

function onDragLeave(listId: string) {
  if (dropTargetListId.value === listId) {
    dropTargetListId.value = null
  }
}

async function onDrop(targetListId: string) {
  const task = dragTask.value
  dropTargetListId.value = null
  onDragEnd()
  if (!task || task.listId === targetListId) return
  if (!requireEdit(task.listId, 'déplacer cette tâche')) return
  if (!requireEdit(targetListId, 'déposer dans cette liste')) return

  const list = listsStore.lists.find((l) => l.id === targetListId)
  const optimistic: Task = {
    ...task,
    listId: targetListId,
    list: list
      ? { id: list.id, name: list.name, color: list.color ?? null }
      : task.list,
  }
  tasksStore.moveTask(optimistic, task.listId)

  try {
    const updated = await api.put<Task>(`/tasks/${task.id}`, { listId: targetListId })
    tasksStore.moveTask(
      {
        ...updated,
        list: list ? { id: list.id, name: list.name, color: list.color ?? null } : updated.list,
      },
      task.listId
    )
  } catch (e) {
    toast.fromApiError(e, 'Impossible de déplacer la tâche')
    tasksStore.moveTask(task, targetListId)
  }
}

function openTask(task: Task) {
  if (task.listId !== listsStore.selectedListId) {
    listsStore.selectList(task.listId)
  }
  tasksStore.selectTask(task.id)
}

async function toggleComplete(task: Task) {
  if (!requireEdit(task.listId, 'modifier cette tâche')) return
  try {
    const updated = await api.patch<Task>(`/tasks/${task.id}/toggle`)
    tasksStore.updateTask(updated)
  } catch (e) {
    toast.fromApiError(e)
  }
}
</script>
