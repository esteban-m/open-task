<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';

import LeftSidebar from './LeftSidebar.vue';
</script>

<template>
  <Story title="Layout/LeftSidebar" :setup-app="seedStores">
    <Variant title="Default">
      <div class="w-72 h-[560px] border border-border rounded-lg overflow-hidden">
        <LeftSidebar />
      </div>
    </Variant>
  </Story>
</template>
