<script setup lang="ts">
import { mockList } from '../../histoire/fixtures';
import { seedStores } from '../../histoire/seed-stores';

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
    <Variant title="Default">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <ListEditModal :list="mockList" @close="onClose" @saved="onSaved" />
      </div>
    </Variant>
  </Story>
</template>
