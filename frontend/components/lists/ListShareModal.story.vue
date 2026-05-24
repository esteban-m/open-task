<script setup lang="ts">
import { reactive } from 'vue';

import { mockList } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';

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
    <Variant title="Default">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <ListShareModal
          :list-id="state.listId"
          :list-name="state.listName"
          :visible="state.visible"
          @close="onClose"
          @refresh="onRefresh"
        />
      </div>

      <template #controls>
        <HstText v-model="state.listName" title="listName" />
        <HstCheckbox v-model="state.visible" title="visible" />
      </template>
    </Variant>
  </Story>
</template>
