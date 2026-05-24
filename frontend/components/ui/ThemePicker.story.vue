<script setup lang="ts">
import { reactive } from 'vue';

import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';
import ThemePicker from './ThemePicker.vue';

const state = reactive({
  collapsed: false,
});
</script>

<template>
  <Story title="UI/ThemePicker">
    <Variant title="Expanded" :source="usage.themePicker(false)">
      <StoryPreview frame="theme-picker">
        <ThemePicker :collapsed="false" />
      </StoryPreview>
    </Variant>

    <Variant title="Collapsed" :source="usage.themePicker(true)">
      <StoryPreview frame="theme-picker">
        <ThemePicker :collapsed="true" />
      </StoryPreview>
    </Variant>

    <Variant title="Interactive" :source="usage.themePicker(state.collapsed)">
      <StoryPreview frame="theme-picker">
        <ThemePicker :collapsed="state.collapsed" />
      </StoryPreview>

      <template #controls>
        <HstCheckbox v-model="state.collapsed" title="collapsed" />
      </template>
    </Variant>
  </Story>
</template>
