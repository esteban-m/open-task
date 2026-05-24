<script setup lang="ts">
import { reactive } from 'vue';

import { MARKDOWN_SAMPLE } from '../../histoire/fixtures';
import MarkdownContent from './MarkdownContent.vue';

const state = reactive({
  content: MARKDOWN_SAMPLE,
  compact: false,
  interactiveChecklists: false,
});
</script>

<template>
  <Story title="Common/MarkdownContent">
    <Variant title="Default">
      <div class="min-h-[320px] max-w-xl bg-surface text-text p-6 font-sans antialiased">
        <MarkdownContent
          :content="MARKDOWN_SAMPLE"
          :compact="false"
          :interactive-checklists="false"
        />
      </div>
    </Variant>

    <Variant title="Compact">
      <div class="min-h-[320px] max-w-xl bg-surface text-text p-6 font-sans antialiased">
        <MarkdownContent
          :content="MARKDOWN_SAMPLE"
          :compact="true"
          :interactive-checklists="false"
        />
      </div>
    </Variant>

    <Variant title="Interactive">
      <div class="min-h-[320px] max-w-xl bg-surface text-text p-6 font-sans antialiased">
        <MarkdownContent
          :content="state.content"
          :compact="state.compact"
          :interactive-checklists="state.interactiveChecklists"
        />
      </div>

      <template #controls>
        <HstTextarea v-model="state.content" title="content" />
        <HstCheckbox v-model="state.compact" title="compact" />
        <HstCheckbox v-model="state.interactiveChecklists" title="interactiveChecklists" />
      </template>
    </Variant>
  </Story>
</template>
