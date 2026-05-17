<template>
  <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Pas de liste sélectionnée -->
    <div v-if="!listsStore.selectedList" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-14 h-14 rounded-xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-text-muted text-sm">Sélectionnez une liste pour afficher les tâches</p>
        <p class="text-text-faint text-xs mt-1">ou créez une nouvelle liste dans la barre latérale</p>
      </div>
    </div>

    <!-- Liste sélectionnée -->
    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <h1 class="text-base font-semibold truncate">{{ listsStore.selectedList.name }}</h1>
        <span class="text-text-faint text-xs">
          {{ tasksStore.activeTasks.length }} tâche{{ tasksStore.activeTasks.length !== 1 ? 's' : '' }} active{{ tasksStore.activeTasks.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Corps scrollable -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        <!-- Formulaire d'ajout -->
        <TaskForm @created="onTaskCreated" />

        <!-- Loader -->
        <div v-if="tasksStore.loading" class="flex items-center justify-center py-8">
          <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>

        <template v-else>
          <!-- Tâches actives -->
          <div v-if="tasksStore.activeTasks.length === 0 && tasksStore.completedTasks.length === 0" class="py-8 text-center text-text-faint text-sm">
            Aucune tâche — ajoutez-en une ci-dessus
          </div>

          <TaskCard
            v-for="task in tasksStore.activeTasks"
            :key="task.id"
            :task="task"
          />

          <!-- Section tâches terminées -->
          <div v-if="tasksStore.completedTasks.length > 0" class="mt-4">
            <button
              @click="tasksStore.toggleCompletedCollapsed()"
              class="flex items-center gap-2 text-text-faint hover:text-text-muted text-xs mb-2 w-full text-left"
            >
              <svg
                :class="['w-3.5 h-3.5 transition-transform', tasksStore.completedCollapsed ? '' : 'rotate-90']"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              Mes tâches terminées ({{ tasksStore.completedTasks.length }})
            </button>

            <div v-if="!tasksStore.completedCollapsed" class="space-y-1">
              <TaskCard
                v-for="task in tasksStore.completedTasks"
                :key="task.id"
                :task="task"
              />
            </div>
          </div>
        </template>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
const listsStore = useListsStore()
const tasksStore = useTasksStore()

function onTaskCreated() {
  // La tâche est déjà ajoutée au store via WebSocket ou réponse API dans TaskForm
}
</script>
