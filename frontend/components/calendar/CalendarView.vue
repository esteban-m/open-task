<template>
  <div class="flex flex-col flex-1 min-h-0 gap-3 lg:flex-row lg:gap-4 overflow-hidden">
    <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
      <div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 flex-shrink-0">
        <div class="flex items-center p-0.5 rounded-lg bg-surface-2 border border-border">
          <button
            v-for="s in scales"
            :key="s.id"
            type="button"
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
              calendarScale === s.id ? 'bg-surface-1 text-text shadow-sm' : 'text-text-muted hover:text-text',
            ]"
            @click="calendarScale = s.id"
          >
            {{ s.label }}
          </button>
        </div>

        <div class="flex items-center gap-1">
          <button type="button" class="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2" @click="navigate(-1)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button type="button" class="px-2 sm:px-3 py-1.5 text-sm font-medium text-text min-w-0 sm:min-w-[160px] flex-1 sm:flex-none text-center hover:bg-surface-2 rounded-lg capitalize truncate" @click="goToToday">
            {{ periodLabel }}
          </button>
          <button type="button" class="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2" @click="navigate(1)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button type="button" class="text-xs px-2.5 py-1 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2" @click="goToToday">
          Aujourd'hui
        </button>
        <span class="text-xs text-text-faint w-full sm:w-auto sm:ml-auto text-right">{{ tasksStore.allTasks.length }} tâche{{ tasksStore.allTasks.length !== 1 ? 's' : '' }}</span>
      </div>

      <p v-if="tasksStore.allTasks.length === 0" class="text-xs text-text-faint mb-3">
        Aucune tâche avec échéance — le calendrier reste utilisable pour naviguer.
      </p>

      <!-- MOIS -->
      <template v-if="calendarScale === 'month'">
        <div class="grid grid-cols-7 gap-px mb-px">
          <div v-for="label in weekLabels" :key="label" class="py-2 text-center text-[11px] font-medium uppercase text-text-faint">{{ label }}</div>
        </div>
        <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-border">
          <div class="grid grid-cols-7 gap-px min-h-[min(70vh,480px)] sm:min-h-[480px]">
            <button
              v-for="(cell, i) in monthCells"
              :key="i"
              type="button"
              :class="dayCellClass(cell.date, cell.inMonth)"
              @click="pickDay(cell.date)"
            >
              <span :class="dayNumClass(cell.date, cell.inMonth)">{{ cell.date.getDate() }}</span>
              <div class="flex-1 space-y-0.5 overflow-hidden mt-1">
                <div
                  v-for="task in dayTasks(cell.date).slice(0, 3)"
                  :key="task.id"
                  :class="chipClass(task)"
                  :style="{ borderLeftColor: colorForTask(task) }"
                  @click.stop="openTask(task)"
                >
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ backgroundColor: colorForTask(task) }" />
                  <span class="truncate">{{ task.shortDescription }}</span>
                </div>
                <span v-if="dayTasks(cell.date).length > 3" class="text-[10px] text-text-faint px-1">+{{ dayTasks(cell.date).length - 3 }}</span>
              </div>
            </button>
          </div>
        </div>
      </template>

      <!-- SEMAINE -->
      <template v-else-if="calendarScale === 'week'">
        <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-border">
          <div class="min-w-[640px]">
            <div class="grid grid-cols-7 min-h-[min(70vh,480px)] sm:min-h-[480px] divide-x divide-border">
            <div v-for="day in weekDays" :key="dateKeyFromDate(day)" class="flex flex-col bg-surface-1 min-w-0">
              <button type="button" :class="['p-2 text-left bg-surface-2/50', weekHeadClass(day)]" @click="pickDay(day)">
                <p class="text-[10px] uppercase text-text-faint">{{ weekdayShort(day) }}</p>
                <p :class="['text-lg font-semibold', isSameDay(day, today) ? 'text-accent' : 'text-text']">{{ day.getDate() }}</p>
              </button>
              <div class="flex-1 overflow-y-auto p-1.5 space-y-1">
                <button
                  v-for="task in dayTasks(day)"
                  :key="task.id"
                  type="button"
                  :class="blockClass(task, true)"
                  :style="{ borderLeftColor: colorForTask(task) }"
                  @click="openTask(task)"
                >
                  <p class="truncate font-medium">{{ task.shortDescription }}</p>
                </button>
                <p v-if="!dayTasks(day).length" class="text-[10px] text-text-faint text-center py-4">—</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </template>

      <!-- JOUR -->
      <template v-else>
        <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-surface-1">
          <div class="p-4 bg-surface-2/40 rounded-t-xl">
            <p class="text-xs text-text-faint uppercase">{{ weekdayLong(focusDay) }}</p>
            <p class="text-2xl font-semibold" :class="isSameDay(focusDay, today) ? 'text-accent' : 'text-text'">
              {{ focusDay.getDate() }}
              <span class="text-base font-normal text-text-muted capitalize">{{ focusDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}</span>
            </p>
          </div>
          <div class="p-4 space-y-2">
            <button
              v-for="task in dayTasks(focusDay)"
              :key="task.id"
              type="button"
              :class="blockClass(task, false)"
              :style="{ borderLeftColor: colorForTask(task) }"
              @click="openTask(task)"
            >
              <p :class="['font-medium', task.completed && 'line-through text-text-faint']">{{ task.shortDescription }}</p>
              <p class="text-xs text-text-faint mt-1">{{ task.list?.name }}</p>
              <MarkdownContent
                v-if="task.longDescription"
                :content="task.longDescription"
                compact
                class-name="mt-2 text-left"
                :interactive-checklists="!task.completed"
                :task-id="task.id"
              />
            </button>
            <p v-if="!dayTasks(focusDay).length" class="text-sm text-text-faint text-center py-12">Aucune tâche ce jour-là</p>
          </div>
        </div>
      </template>
    </div>

    <aside
      v-if="selectedDay && calendarScale !== 'day'"
      class="w-full lg:w-72 flex-shrink-0 lg:border-l lg:border-border lg:pl-4 flex flex-col max-h-[38vh] lg:max-h-none overflow-hidden rounded-xl lg:rounded-none bg-surface-2/30 lg:bg-transparent p-3 lg:p-0"
    >
      <div class="flex items-center justify-between mb-3">
        <div>
          <p class="text-xs text-text-faint uppercase">Journée</p>
          <p class="text-sm font-semibold capitalize">{{ selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
        </div>
        <span class="text-xs text-text-faint">{{ selectedDayTasks.length }} tâche{{ selectedDayTasks.length !== 1 ? 's' : '' }}</span>
      </div>
      <div v-if="!selectedDayTasks.length" class="text-sm text-text-faint text-center py-8">Aucune tâche</div>
      <div v-else class="flex-1 overflow-y-auto space-y-2">
        <button
          v-for="task in selectedDayTasks"
          :key="task.id"
          type="button"
          :class="[blockClass(task, false), tasksStore.selectedTaskId === task.id && 'border-accent/40 bg-accent-subtle']"
          :style="{ borderLeftColor: colorForTask(task) }"
          @click="openTask(task)"
        >
          <p :class="['text-sm font-medium', task.completed && 'line-through text-text-faint']">{{ task.shortDescription }}</p>
          <p class="text-xs text-text-faint mt-1">{{ task.list?.name }}</p>
          <MarkdownContent
            v-if="task.longDescription"
            :content="task.longDescription"
            compact
            class-name="mt-2 text-left"
            :interactive-checklists="!task.completed"
            :task-id="task.id"
          />
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/stores/tasks'
import MarkdownContent from '~/components/common/MarkdownContent.vue'

type Scale = 'month' | 'week' | 'day'

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const { colorForTask } = useListColor()

const scales: { id: Scale; label: string }[] = [
  { id: 'month', label: 'Mois' },
  { id: 'week', label: 'Semaine' },
  { id: 'day', label: 'Jour' },
]

const calendarScale = ref<Scale>('month')
const viewDate = ref(startOfDay(new Date()))
const selectedDay = ref<Date>(startOfDay(new Date()))
const today = startOfDay(new Date())
const weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const focusDay = computed(() => selectedDay.value)

const periodLabel = computed(() => {
  if (calendarScale.value === 'month') {
    return viewDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  if (calendarScale.value === 'week') {
    const days = getWeekDays(viewDate.value)
    const a = days[0]!
    const b = days[6]!
    if (a.getMonth() === b.getMonth()) {
      return `${a.getDate()} – ${b.getDate()} ${b.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
    }
    return `${a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  return focusDay.value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

const tasksByDate = computed(() => {
  const map = new Map<string, Task[]>()
  for (const task of tasksStore.allTasks) {
    const key = dueDateKey(task.dueDate)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(task)
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.completed === b.completed ? a.shortDescription.localeCompare(b.shortDescription) : a.completed ? 1 : -1))
  }
  return map
})

const monthCells = computed(() => {
  const y = viewDate.value.getFullYear()
  const m = viewDate.value.getMonth()
  const offset = (new Date(y, m, 1).getDay() + 6) % 7
  const start = new Date(y, m, 1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i)
    return { date, inMonth: date.getMonth() === m }
  })
})

const weekDays = computed(() => getWeekDays(viewDate.value))
const selectedDayTasks = computed(() => tasksByDate.value.get(dateKeyFromDate(selectedDay.value)) ?? [])

function dayTasks(day: Date) {
  return tasksByDate.value.get(dateKeyFromDate(day)) ?? []
}

function dayCellClass(date: Date, inMonth: boolean) {
  return [
    'min-h-[64px] sm:min-h-[88px] p-1 sm:p-1.5 text-left flex flex-col bg-surface-1 hover:bg-surface-2 transition-colors',
    !inMonth && 'opacity-40',
    isSameDay(date, today) && 'ring-1 ring-inset ring-accent/50 bg-accent-subtle/30',
    isSameDay(date, selectedDay.value) && 'ring-1 ring-inset ring-accent bg-surface-3',
  ]
}

function dayNumClass(date: Date, inMonth: boolean) {
  return [
    'text-xs font-medium w-6 h-6 inline-flex items-center justify-center rounded-full',
    isSameDay(date, today) ? 'bg-accent text-white' : inMonth ? 'text-text-muted' : 'text-text-faint',
  ]
}

function weekHeadClass(day: Date) {
  return [isSameDay(day, today) && 'bg-accent-subtle/40', isSameDay(day, selectedDay.value) && 'bg-surface-3']
}

function chipClass(task: Task) {
  return [
    'flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate cursor-pointer border-l-2 bg-surface-2/80',
    task.completed && 'opacity-50 line-through',
    isOverdue(task) && 'bg-danger-subtle/50',
  ]
}

function blockClass(task: Task, compact: boolean) {
  return [
    'w-full text-left rounded-lg border border-border bg-surface-2 hover:bg-surface-3 border-l-[3px] transition-colors',
    compact ? 'p-1.5 text-[10px]' : 'p-3 text-sm',
    task.completed && 'opacity-60',
    isOverdue(task) && 'border-danger/30',
  ]
}

function isOverdue(task: Task) {
  return !task.completed && parseDueDate(task.dueDate) < today
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
}

function weekdayLong(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long' })
}

function navigate(delta: number) {
  if (calendarScale.value === 'month') {
    const d = viewDate.value
    viewDate.value = new Date(d.getFullYear(), d.getMonth() + delta, 1)
  } else if (calendarScale.value === 'week') {
    viewDate.value = addDays(viewDate.value, delta * 7)
  } else {
    const n = addDays(focusDay.value, delta)
    viewDate.value = n
    selectedDay.value = n
  }
}

function goToToday() {
  const n = startOfDay(new Date())
  viewDate.value = n
  selectedDay.value = n
}

function pickDay(day: Date) {
  selectedDay.value = startOfDay(day)
  if (calendarScale.value === 'day') viewDate.value = selectedDay.value
}

function openTask(task: Task) {
  if (task.listId && listsStore.selectedListId !== task.listId) {
    listsStore.selectList(task.listId)
  }
  tasksStore.selectTask(task.id)
}
</script>
