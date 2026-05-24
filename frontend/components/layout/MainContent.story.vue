<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import MainContent from './MainContent.vue';
</script>

<template>
  <Story title="Layout/MainContent" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="List view" :source="usage.mainContent()">
      <StoryPreview frame="main">
        <MainContent />
      </StoryPreview>
    </Variant>
  </Story>
</template>
