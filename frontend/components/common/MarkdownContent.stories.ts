import type { Meta, StoryObj } from '@storybook/vue3';

import { importLine, MARKDOWN_SAMPLE, parts } from '../../.storybook/vue-usage';
import MarkdownContent from './MarkdownContent.vue';

const meta = {
  title: 'Common/MarkdownContent',
  component: MarkdownContent,
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: ({ content = MARKDOWN_SAMPLE, compact = false, interactiveChecklists = false }) =>
        parts(
          `<MarkdownContent
    :content="content"
    :compact="compact"
    :interactive-checklists="interactiveChecklists"
  />`,
          `${importLine('MarkdownContent', '~/components/common/MarkdownContent.vue')}

const content = ${JSON.stringify(content)}
const compact = ${Boolean(compact)}
const interactiveChecklists = ${Boolean(interactiveChecklists)}`,
        ),
    },
  },
  argTypes: {
    compact: { control: 'boolean' },
    interactiveChecklists: { control: 'boolean' },
    content: { control: 'text' },
  },
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { content: MARKDOWN_SAMPLE, compact: false, interactiveChecklists: false },
};

export const Compact: Story = {
  args: { content: MARKDOWN_SAMPLE, compact: true, interactiveChecklists: false },
};
