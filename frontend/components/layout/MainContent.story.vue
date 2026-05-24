<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';

import MainContent from './MainContent.vue';
</script>

<template>
  <Story title="Layout/MainContent" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="List view">
      <div class="min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased">
        <div class="h-[560px] flex flex-col border border-border rounded-lg overflow-hidden">
          <MainContent />
        </div>
      </div>
    </Variant>
  </Story>
</template>
