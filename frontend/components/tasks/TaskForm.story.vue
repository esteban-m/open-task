<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import TaskForm from './TaskForm.vue';

function onTaskCreated() {
  // recharger les tâches ou naviguer
}
</script>

<template>
  <Story title="Tasks/TaskForm" :setup-app="seedStores">
    <Variant title="Default" :source="usage.taskForm()">
      <StoryPreview>
        <TaskForm @created="onTaskCreated" />
      </StoryPreview>
    </Variant>
  </Story>
</template>
