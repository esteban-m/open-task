<script setup lang="ts">
import { reactive } from 'vue';

import ThemePicker from './ThemePicker.vue';

const state = reactive({
  collapsed: false,
});
</script>

<template>
  <Story title="UI/ThemePicker">
    <Variant title="Expanded">
      <div class="w-64 min-h-[320px] bg-surface text-text p-6 font-sans antialiased">
        <ThemePicker :collapsed="false" />
      </div>
    </Variant>

    <Variant title="Collapsed">
      <div class="w-64 min-h-[320px] bg-surface text-text p-6 font-sans antialiased">
        <ThemePicker :collapsed="true" />
      </div>
    </Variant>

    <Variant title="Interactive">
      <div class="w-64 min-h-[320px] bg-surface text-text p-6 font-sans antialiased">
        <ThemePicker :collapsed="state.collapsed" />
      </div>

      <template #controls>
        <HstCheckbox v-model="state.collapsed" title="collapsed" />
      </template>
    </Variant>
  </Story>
</template>
