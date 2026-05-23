import type { Meta, StoryObj } from '@storybook/vue3';

import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import MarkdownContent from './MarkdownContent.vue';

const meta = {
  title: 'Common/MarkdownContent',
  component: MarkdownContent,
  tags: ['autodocs'],
  parameters: vueUsageSnippet('<MarkdownContent :content="markdown" :compact="false" />'),
  argTypes: {
    compact: { control: 'boolean' },
    interactiveChecklists: { control: 'boolean' },
  },
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = `# Notes

- [ ] Point ouvert
- [x] Point fait

**Gras** et _italique_ avec une [lien](https://example.com).`;

export const Default: Story = {
  args: { content: sample, compact: false, interactiveChecklists: false },
};

export const Compact: Story = {
  args: { content: sample, compact: true, interactiveChecklists: false },
};
