<template>
  <Teleport to="body">
    <div
      class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[min(100vw-2rem,22rem)] pointer-events-none sm:bottom-6 sm:right-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md',
            toastClass(t.type),
          ]"
          role="alert"
        >
          <span class="flex-shrink-0 mt-0.5" v-html="iconSvg(t.type)" />
          <p class="text-sm leading-snug flex-1">{{ t.message }}</p>
          <button
            type="button"
            class="flex-shrink-0 p-0.5 rounded opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Fermer"
            @click="dismiss(t.id)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastType } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

function toastClass(type: ToastType) {
  const map: Record<ToastType, string> = {
    error: 'bg-danger-subtle/95 border-danger/40 text-text',
    success: 'bg-success-subtle/95 border-success/40 text-text',
    warning: 'bg-amber-500/10 border-amber-500/30 text-text',
    info: 'bg-accent-subtle/95 border-accent/30 text-text',
  }
  return map[type]
}

function iconSvg(type: ToastType) {
  const cls = 'w-5 h-5'
  if (type === 'error') {
    return `<svg class="${cls} text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  }
  if (type === 'success') {
    return `<svg class="${cls} text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  }
  if (type === 'warning') {
    return `<svg class="${cls} text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
  }
  return `<svg class="${cls} text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
