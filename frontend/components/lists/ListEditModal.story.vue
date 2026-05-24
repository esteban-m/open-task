<script setup lang="ts">
import { mockList } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import ListEditModal from './ListEditModal.vue';

function onClose() {
  // fermer le modal
}

function onSaved() {
  // rafraîchir les listes
}
</script>

<template>
  <Story title="Lists/ListEditModal" :setup-app="seedStores">
    <Variant title="Default" :source="usage.listEditModal(mockList)">
      <StoryPreview>
        <ListEditModal :list="mockList" @close="onClose" @saved="onSaved" />
      </StoryPreview>
    </Variant>
  </Story>
</template>
