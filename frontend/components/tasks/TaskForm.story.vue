<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';

import TaskForm from './TaskForm.vue';

function onTaskCreated() {
  // recharger les tâches ou naviguer
}
</script>

<template>
  <Story title="Tasks/TaskForm" :setup-app="seedStores">
    <Variant title="Default">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <TaskForm @created="onTaskCreated" />
      </div>
    </Variant>
  </Story>
</template>
