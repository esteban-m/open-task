<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import LeftSidebar from './LeftSidebar.vue';
</script>

<template>
  <Story title="Layout/LeftSidebar" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="Default" :source="usage.leftSidebar()">
      <StoryPreview frame="sidebar">
        <LeftSidebar />
      </StoryPreview>
    </Variant>
  </Story>
</template>
