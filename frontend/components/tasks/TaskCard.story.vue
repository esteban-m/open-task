<script setup lang="ts">
import { mockTask, mockTaskDone } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';
import { useTasksStore } from '~/stores/tasks';

import TaskCard from './TaskCard.vue';

function selectTask() {
  seedStores();
  useTasksStore().selectTask(mockTask.id);
}
</script>

<template>
  <Story title="Tasks/TaskCard" :setup-app="seedStores">
    <Variant title="Active">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <TaskCard :task="mockTask" />
      </div>
    </Variant>

    <Variant title="Completed">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <TaskCard :task="mockTaskDone" />
      </div>
    </Variant>

    <Variant title="Selected" :setup-app="selectTask">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <TaskCard :task="mockTask" />
      </div>
    </Variant>
  </Story>
</template>
