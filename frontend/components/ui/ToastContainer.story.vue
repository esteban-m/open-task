<script setup lang="ts">
import { useToast } from '~/composables/useToast';

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
    <Variant title="With toasts" :setup-app="setupWithToasts">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <ToastContainer />
      </div>
    </Variant>

    <Variant title="Empty">
      <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased flex items-center justify-center">
        <ToastContainer />
      </div>
    </Variant>
  </Story>
</template>
