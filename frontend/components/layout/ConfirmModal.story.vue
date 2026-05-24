<script setup lang="ts">
import { reactive } from 'vue';

import ConfirmModal from './ConfirmModal.vue';

const state = reactive({
  title: 'Supprimer la liste ?',
  message: 'Cette action est irréversible. Toutes les tâches associées seront supprimées.',
  confirmLabel: 'Supprimer',
});

function onConfirm() {
  // action destructive
}

function onCancel() {
  // fermer le modal
}
</script>

<template>
  <Story title="Layout/ConfirmModal">
    <Variant title="Default">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <ConfirmModal
          :title="state.title"
          :message="state.message"
          :confirm-label="state.confirmLabel"
          @confirm="onConfirm"
          @cancel="onCancel"
        />
      </div>

      <template #controls>
        <HstText v-model="state.title" title="title" />
        <HstTextarea v-model="state.message" title="message" />
        <HstText v-model="state.confirmLabel" title="confirmLabel" />
      </template>
    </Variant>
  </Story>
</template>
