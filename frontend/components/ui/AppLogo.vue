<template>
  <img
    :src="heroSrc"
    alt="Open-Task"
    :class="sizeClass"
    class="flex-shrink-0 rounded-lg"
  />
</template>

<script setup lang="ts">
import heroSrc from '~/public/hero.svg?url'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'w-12 h-12'
    case 'md':
      return 'w-10 h-10'
    default:
      return 'w-8 h-8'
  }
})
</script>
