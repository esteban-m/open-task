<script setup lang="ts">
import { reactive } from 'vue';

import AppLogo from './AppLogo.vue';

const state = reactive({
  size: 'sm' as 'sm' | 'md' | 'lg',
});
</script>

<template>
  <Story title="UI/AppLogo">
    <Variant title="Small">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <AppLogo size="sm" />
      </div>
    </Variant>

    <Variant title="Medium">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <AppLogo size="md" />
      </div>
    </Variant>

    <Variant title="Large">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <AppLogo size="lg" />
      </div>
    </Variant>

    <Variant title="Interactive">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <AppLogo :size="state.size" />
      </div>

      <template #controls>
        <HstSelect
          v-model="state.size"
          title="size"
          :options="[
            { label: 'sm', value: 'sm' },
            { label: 'md', value: 'md' },
            { label: 'lg', value: 'lg' },
          ]"
        />
      </template>
    </Variant>
  </Story>
</template>
