<script setup lang="ts">
import { reactive } from 'vue';

import StoryPreview from '../../histoire/StoryPreview.vue';
import { MARKDOWN_SAMPLE } from '../../histoire/fixtures';
import { usage } from '../../histoire/source';
import MarkdownContent from './MarkdownContent.vue';

const state = reactive({
  content: MARKDOWN_SAMPLE,
  compact: false,
  interactiveChecklists: false,
});
</script>

<template>
  <Story title="Common/MarkdownContent">
    <Variant
      title="Default"
      :source="usage.markdownContent({ compact: false, interactiveChecklists: false })"
    >
      <StoryPreview frame="centered">
        <div class="max-w-xl w-full">
          <MarkdownContent
            :content="MARKDOWN_SAMPLE"
            :compact="false"
            :interactive-checklists="false"
          />
        </div>
      </StoryPreview>
    </Variant>

    <Variant title="Compact" :source="usage.markdownContent({ compact: true, interactiveChecklists: false })">
      <StoryPreview frame="centered">
        <div class="max-w-xl w-full">
          <MarkdownContent
            :content="MARKDOWN_SAMPLE"
            :compact="true"
            :interactive-checklists="false"
          />
        </div>
      </StoryPreview>
    </Variant>

    <Variant
      title="Interactive"
      :source="usage.markdownContent(state)"
    >
      <StoryPreview frame="centered">
        <div class="max-w-xl w-full">
          <MarkdownContent
            :content="state.content"
            :compact="state.compact"
            :interactive-checklists="state.interactiveChecklists"
          />
        </div>
      </StoryPreview>

      <template #controls>
        <HstTextarea v-model="state.content" title="content" />
        <HstCheckbox v-model="state.compact" title="compact" />
        <HstCheckbox v-model="state.interactiveChecklists" title="interactiveChecklists" />
      </template>
    </Variant>
  </Story>
</template>
