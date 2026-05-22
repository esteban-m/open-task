<template>
  <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <button
          type="button"
          class="md:hidden p-2 -ml-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 flex-shrink-0"
          aria-label="Ouvrir les listes"
          @click="openDrawer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      <div class="min-w-0">
        <h1 class="text-base font-semibold truncate">{{ headerTitle }}</h1>
        <p class="text-xs text-text-faint mt-0.5">{{ headerSubtitle }}</p>
      </div>
      </div>

      <div class="flex items-center p-0.5 rounded-lg bg-surface-2 border border-border flex-shrink-0 w-full sm:w-auto">
        <button
          v-for="v in viewOptions"
          :key="v.id"
          type="button"
          :data-testid="`view-${v.id}`"
          :class="viewBtnClass(v.id)"
          :title="v.label"
          @click="setViewMode(v.id)"
        >
          <component :is="v.icon" class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="hidden sm:inline">{{ v.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'calendar'" class="flex-1 min-h-0 flex flex-col px-3 sm:px-4 py-3 overflow-hidden">
      <div v-if="tasksStore.allTasksLoading" class="flex-1 flex items-center justify-center">
        <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      <CalendarView v-else />
    </div>

    <div v-else-if="viewMode === 'kanban'" class="flex-1 min-h-0 flex flex-col px-3 sm:px-4 py-3 overflow-hidden">
      <div v-if="tasksStore.allTasksLoading" class="flex-1 flex items-center justify-center">
        <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      <KanbanView v-else />
    </div>

    <template v-else>
      <div v-if="!listsStore.selectedList" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <p class="text-text-muted text-sm">Sélectionnez une liste pour afficher les tâches</p>
          <p class="text-text-faint text-xs mt-1">ou passez en vue calendrier / kanban</p>
        </div>
      </div>

      <div v-else class="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        <TaskForm @created="onTaskCreated" />

        <div v-if="tasksStore.loading" class="flex items-center justify-center py-8">
          <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <template v-else>
          <div
            v-if="tasksStore.activeTasks.length === 0 && tasksStore.completedTasks.length === 0"
            class="py-8 text-center text-text-faint text-sm"
          >
            Aucune tâche — ajoutez-en une ci-dessus
          </div>

          <TaskCard v-for="task in tasksStore.activeTasks" :key="task.id" :task="task" />

          <div v-if="tasksStore.completedTasks.length > 0" class="mt-4">
            <button
              type="button"
              class="flex items-center gap-2 text-text-faint hover:text-text-muted text-xs mb-2 w-full text-left"
              @click="tasksStore.toggleCompletedCollapsed()"
            >
              <svg
                :class="['w-3.5 h-3.5 transition-transform', tasksStore.completedCollapsed ? '' : 'rotate-90']"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              Mes tâches terminées ({{ tasksStore.completedTasks.length }})
            </button>
            <div v-if="!tasksStore.completedCollapsed" class="space-y-1">
              <TaskCard v-for="task in tasksStore.completedTasks" :key="task.id" :task="task" />
            </div>
          </div>
        </template>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { h } from 'vue'
import TaskForm from '~/components/tasks/TaskForm.vue'
import TaskCard from '~/components/tasks/TaskCard.vue'
import CalendarView from '~/components/calendar/CalendarView.vue'
import KanbanView from '~/components/kanban/KanbanView.vue'

type ViewMode = 'list' | 'calendar' | 'kanban'

const VIEW_KEY = 'mainContentView'

const { openDrawer } = useLeftDrawer()
const listsStore = useListsStore()
const tasksStore = useTasksStore()

const viewMode = ref<ViewMode>('list')

const viewOptions = [
  {
    id: 'list' as const,
    label: 'Liste',
    icon: () =>
      h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6h16M4 12h16M4 18h16' }),
      ]),
  },
  {
    id: 'kanban' as const,
    label: 'Kanban',
    icon: () =>
      h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' }),
      ]),
  },
  {
    id: 'calendar' as const,
    label: 'Calendrier',
    icon: () =>
      h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }),
      ]),
  },
]

const headerTitle = computed(() => {
  if (viewMode.value === 'calendar') return 'Calendrier'
  if (viewMode.value === 'kanban') return 'Kanban'
  return listsStore.selectedList?.name ?? 'Tâches'
})

const headerSubtitle = computed(() => {
  if (viewMode.value === 'calendar' || viewMode.value === 'kanban') {
    const n = tasksStore.allTasks.length
    return `${listsStore.lists.length} liste${listsStore.lists.length !== 1 ? 's' : ''} · ${n} tâche${n !== 1 ? 's' : ''}`
  }
  if (listsStore.selectedList) {
    return `${tasksStore.activeTasks.length} active${tasksStore.activeTasks.length !== 1 ? 's' : ''} · ${tasksStore.completedTasks.length} terminée${tasksStore.completedTasks.length !== 1 ? 's' : ''}`
  }
  return 'Sélectionnez une liste'
})

function viewBtnClass(id: ViewMode) {
  return [
    'flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors min-w-[2.25rem] sm:min-w-0',
    viewMode.value === id ? 'bg-surface-1 text-text shadow-sm' : 'text-text-muted hover:text-text',
  ]
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null
    if (saved === 'list' || saved === 'calendar' || saved === 'kanban') {
      viewMode.value = saved
    }
  }
  if (viewMode.value === 'calendar' || viewMode.value === 'kanban') {
    loadAllTasksForCalendar()
  }
})

watch(viewMode, (mode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VIEW_KEY, mode)
  }
  if (mode === 'calendar' || mode === 'kanban') {
    loadAllTasksForCalendar()
  }
})

watch(
  () => listsStore.lists,
  () => {
    if ((viewMode.value === 'calendar' || viewMode.value === 'kanban') && tasksStore.allTasks.length) {
      tasksStore.setAllTasks(enrichTasksWithLists(tasksStore.allTasks))
    }
  },
  { deep: true }
)

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
}

function onTaskCreated() {
  if (viewMode.value === 'calendar' || viewMode.value === 'kanban') {
    loadAllTasksForCalendar()
  }
}
</script>
