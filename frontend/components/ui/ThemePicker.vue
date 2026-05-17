<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      :class="[
        'w-full flex items-center gap-2 text-text-muted hover:text-text hover:bg-surface-2 rounded px-3 py-2 text-sm transition-colors',
        collapsed ? 'justify-center px-2' : '',
        open && 'bg-surface-2 text-text',
      ]"
      :title="collapsed ? 'Thème' : undefined"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <span
        class="w-7 h-5 rounded flex-shrink-0 overflow-hidden ring-1 ring-border flex"
        aria-hidden="true"
      >
        <span
          v-for="(c, i) in currentTheme.preview"
          :key="i"
          class="flex-1 h-full"
          :style="{ backgroundColor: c }"
        />
      </span>
      <span v-if="!collapsed" class="flex-1 text-left truncate">{{ currentTheme.name }}</span>
      <span
        v-if="!collapsed"
        :class="[
          'text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0',
          currentTheme.mode === 'light'
            ? 'bg-surface-3 text-text-muted'
            : 'bg-surface-3 text-text-faint',
        ]"
      >
        {{ currentTheme.mode === 'light' ? 'Clair' : 'Sombre' }}
      </span>
      <svg
        v-if="!collapsed"
        :class="['w-3.5 h-3.5 flex-shrink-0 text-text-faint transition-transform', open && 'rotate-180']"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="theme-panel">
      <div
        v-if="open"
        :class="[
          'absolute z-50 p-3 rounded-xl border border-border bg-surface-1 shadow-xl max-h-[min(70vh,420px)] overflow-y-auto',
          collapsed
            ? 'left-full bottom-0 ml-2 w-56'
            : 'left-0 right-0 bottom-full mb-2',
        ]"
        role="listbox"
        aria-label="Choisir un thème"
      >
        <p class="text-[10px] uppercase tracking-wide text-text-faint mb-2">Thème complet</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="theme in themes"
            :key="theme.id"
            type="button"
            role="option"
            :aria-selected="themeId === theme.id"
            :class="[
              'flex flex-col gap-1.5 p-2 rounded-lg border text-left transition-colors',
              themeId === theme.id
                ? 'border-accent bg-accent-subtle'
                : 'border-border hover:border-border-subtle hover:bg-surface-2',
            ]"
            @click="selectTheme(theme.id)"
          >
            <span class="flex h-6 w-full rounded overflow-hidden ring-1 ring-border/80">
              <span
                v-for="(c, i) in theme.preview"
                :key="i"
                class="flex-1 h-full"
                :style="{ backgroundColor: c }"
              />
            </span>
            <span class="text-[11px] font-medium text-text truncate w-full">{{ theme.name }}</span>
            <span class="text-[9px] text-text-faint uppercase">{{ theme.mode === 'light' ? 'Clair' : 'Sombre' }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const { themeId, themes, currentTheme, applyTheme } = useTheme()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function selectTheme(id: string) {
  applyTheme(id)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!open.value || !rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.theme-panel-enter-active,
.theme-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.theme-panel-enter-from,
.theme-panel-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
