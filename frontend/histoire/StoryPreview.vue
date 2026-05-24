<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    frame?: 'centered' | 'sidebar' | 'sidebar-collapsed' | 'sidebar-panel' | 'right-sidebar' | 'main' | 'kanban' | 'calendar' | 'theme-picker';
  }>(),
  { frame: 'centered' },
);

const frameClass = computed(() => {
  switch (props.frame) {
    case 'sidebar':
      return 'w-72 h-[560px] border border-border rounded-lg overflow-hidden';
    case 'sidebar-collapsed':
      return 'w-16 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col';
    case 'sidebar-panel':
      return 'w-72 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col';
    case 'right-sidebar':
      return 'w-80 h-[560px] border border-border rounded-lg overflow-hidden';
    case 'main':
      return 'min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased';
    case 'kanban':
      return 'min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased';
    case 'calendar':
      return 'min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased';
    case 'theme-picker':
      return 'w-64 min-h-[320px] bg-surface text-text p-6 font-sans antialiased';
    default:
      return 'min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center';
  }
});

const innerClass = computed(() => {
  switch (props.frame) {
    case 'main':
      return 'h-[560px] flex flex-col border border-border rounded-lg overflow-hidden';
    case 'kanban':
      return 'h-[420px] flex flex-col';
    case 'calendar':
      return 'h-[480px] flex flex-col';
    default:
      return '';
  }
});
</script>

<template>
  <div :class="frameClass">
    <div v-if="innerClass" :class="innerClass">
      <slot />
    </div>
    <slot v-else />
  </div>
</template>
