<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';

import CalendarView from './CalendarView.vue';
</script>

<template>
  <Story title="Calendar/CalendarView" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="Default">
      <div class="min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased">
        <div class="h-[480px] flex flex-col">
          <CalendarView />
        </div>
      </div>
    </Variant>
  </Story>
</template>
