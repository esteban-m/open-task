<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import KanbanView from './KanbanView.vue';
</script>

<template>
  <Story title="Kanban/KanbanView" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="Default" :source="usage.kanbanView()">
      <StoryPreview frame="kanban">
        <KanbanView />
      </StoryPreview>
    </Variant>
  </Story>
</template>
