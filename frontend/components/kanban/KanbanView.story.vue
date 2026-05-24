<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';

import KanbanView from './KanbanView.vue';
</script>

<template>
  <Story title="Kanban/KanbanView" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="Default">
      <div class="min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased">
        <div class="h-[420px] flex flex-col">
          <KanbanView />
        </div>
      </div>
    </Variant>
  </Story>
</template>
