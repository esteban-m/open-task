<script setup lang="ts">
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import CalendarView from './CalendarView.vue';
</script>

<template>
  <Story title="Calendar/CalendarView" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="Default" :source="usage.calendarView()">
      <StoryPreview frame="calendar">
        <CalendarView />
      </StoryPreview>
    </Variant>
  </Story>
</template>
