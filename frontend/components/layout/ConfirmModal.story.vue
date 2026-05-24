<script setup lang="ts">
import { reactive } from 'vue';

import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

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
    <Variant title="Default" :source="usage.confirmModal(state)">
      <StoryPreview>
        <ConfirmModal
          :title="state.title"
          :message="state.message"
          :confirm-label="state.confirmLabel"
          @confirm="onConfirm"
          @cancel="onCancel"
        />
      </StoryPreview>

      <template #controls>
        <HstText v-model="state.title" title="title" />
        <HstTextarea v-model="state.message" title="message" />
        <HstText v-model="state.confirmLabel" title="confirmLabel" />
      </template>
    </Variant>
  </Story>
</template>
