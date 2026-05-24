<script setup lang="ts">
import { mockTask, mockTaskDone } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';
import { useTasksStore } from '~/stores/tasks';

import TaskCard from './TaskCard.vue';

function selectTask() {
  seedStores();
  useTasksStore().selectTask(mockTask.id);
}
</script>

<template>
  <Story title="Tasks/TaskCard" :setup-app="seedStores">
    <Variant title="Active" :source="usage.taskCard(mockTask)">
      <StoryPreview>
        <TaskCard :task="mockTask" />
      </StoryPreview>
    </Variant>

    <Variant title="Completed" :source="usage.taskCard(mockTaskDone)">
      <StoryPreview>
        <TaskCard :task="mockTaskDone" />
      </StoryPreview>
    </Variant>

    <Variant title="Selected" :source="usage.taskCard(mockTask, true)" :setup-app="selectTask">
      <StoryPreview>
        <TaskCard :task="mockTask" />
      </StoryPreview>
    </Variant>
  </Story>
</template>
