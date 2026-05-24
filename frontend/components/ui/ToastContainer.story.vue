<script setup lang="ts">
import { useToast } from '~/composables/useToast';

import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';
import ToastContainer from './ToastContainer.vue';

function setupWithToasts() {
  const toast = useToast();
  toast.success('Liste créée avec succès');
  toast.error('Impossible de supprimer la tâche');
  toast.info('Invitation envoyée');
}
</script>

<template>
  <Story title="UI/ToastContainer">
    <Variant title="With toasts" :source="usage.toastContainer(true)" :setup-app="setupWithToasts">
      <StoryPreview>
        <ToastContainer />
      </StoryPreview>
    </Variant>

    <Variant title="Empty" :source="usage.toastContainer(false)">
      <StoryPreview>
        <ToastContainer />
      </StoryPreview>
    </Variant>
  </Story>
</template>
