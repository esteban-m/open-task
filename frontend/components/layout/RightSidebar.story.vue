<script setup lang="ts">
import { mockTask } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';
import { useTasksStore } from '~/stores/tasks';

import RightSidebar from './RightSidebar.vue';

function selectTask() {
  seedStores();
  useTasksStore().selectTask(mockTask.id);
}
</script>

<template>
  <Story title="Layout/RightSidebar" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="With selection" :source="usage.rightSidebar(true)" :setup-app="selectTask">
      <StoryPreview frame="right-sidebar">
        <RightSidebar />
      </StoryPreview>
    </Variant>

    <Variant title="Empty" :source="usage.rightSidebar(false)">
      <StoryPreview frame="right-sidebar">
        <RightSidebar />
      </StoryPreview>
    </Variant>
  </Story>
</template>
