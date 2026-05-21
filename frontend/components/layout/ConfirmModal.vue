<template>
  <!-- Overlay -->
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-surface-1 border border-border rounded-xl w-full max-w-sm shadow-xl">
        <!-- Header -->
        <div class="px-5 pt-5 pb-3">
          <h2 class="text-sm font-semibold text-text">{{ title }}</h2>
          <p class="text-text-muted text-sm mt-2 leading-relaxed">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 px-5 pb-5">
          <button
            @click="$emit('cancel')"
            class="flex-1 bg-surface-2 hover:bg-surface-3 text-text-muted text-sm rounded py-2"
          >
            Annuler
          </button>
          <button
            @click="$emit('confirm')"
            class="flex-1 bg-danger hover:opacity-90 text-white text-sm font-medium rounded py-2"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel?: string
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
