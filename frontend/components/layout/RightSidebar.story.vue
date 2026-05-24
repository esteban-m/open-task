<script setup lang="ts">
import { mockTask } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';
import { useTasksStore } from '~/stores/tasks';

import RightSidebar from './RightSidebar.vue';

function selectTask() {
  seedStores();
  useTasksStore().selectTask(mockTask.id);
}
</script>

<template>
  <Story title="Layout/RightSidebar" :setup-app="seedStores">
    <Variant title="With selection" :setup-app="selectTask">
      <div class="w-80 h-[560px] border border-border rounded-lg overflow-hidden">
        <RightSidebar />
      </div>
    </Variant>

    <Variant title="Empty">
      <div class="w-80 h-[560px] border border-border rounded-lg overflow-hidden">
        <RightSidebar />
      </div>
    </Variant>
  </Story>
</template>
