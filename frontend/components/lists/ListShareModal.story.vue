<script setup lang="ts">
import { reactive } from 'vue';

import { mockList } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import ListShareModal from './ListShareModal.vue';

const state = reactive({
  listId: mockList.id,
  listName: mockList.name,
  visible: true,
});

function onClose() {
  // fermer le modal
}

function onRefresh() {
  // recharger les partages
}
</script>

<template>
  <Story title="Lists/ListShareModal" :setup-app="seedStores">
    <Variant title="Default" :source="usage.listShareModal(state)">
      <StoryPreview>
        <ListShareModal
          :list-id="state.listId"
          :list-name="state.listName"
          :visible="state.visible"
          @close="onClose"
          @refresh="onRefresh"
        />
      </StoryPreview>

      <template #controls>
        <HstText v-model="state.listName" title="listName" />
        <HstCheckbox v-model="state.visible" title="visible" />
      </template>
    </Variant>
  </Story>
</template>
