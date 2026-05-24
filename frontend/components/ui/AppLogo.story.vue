<script setup lang="ts">
import { reactive } from 'vue';

import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';
import AppLogo from './AppLogo.vue';

const state = reactive({
  size: 'sm' as 'sm' | 'md' | 'lg',
});
</script>

<template>
  <Story title="UI/AppLogo">
    <Variant title="Small" :source="usage.appLogo('sm')">
      <StoryPreview>
        <AppLogo size="sm" />
      </StoryPreview>
    </Variant>

    <Variant title="Medium" :source="usage.appLogo('md')">
      <StoryPreview>
        <AppLogo size="md" />
      </StoryPreview>
    </Variant>

    <Variant title="Large" :source="usage.appLogo('lg')">
      <StoryPreview>
        <AppLogo size="lg" />
      </StoryPreview>
    </Variant>

    <Variant title="Interactive" :source="usage.appLogo(state.size)">
      <StoryPreview>
        <AppLogo :size="state.size" />
      </StoryPreview>

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
