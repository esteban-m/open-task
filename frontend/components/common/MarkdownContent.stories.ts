import type { Meta, StoryObj } from '@storybook/vue3';

import MarkdownContent from './MarkdownContent.vue';

const meta = {
  title: 'Common/MarkdownContent',
  component: MarkdownContent,
  parameters: { layout: 'centered' },
  argTypes: {
    compact: { control: 'boolean' },
    interactiveChecklists: { control: 'boolean' },
    content: { control: 'text' },
  },
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = `# Notes

- [ ] Point ouvert
- [x] Point fait

**Gras** et _italique_ avec un [lien](https://example.com).`;

export const Default: Story = {
  args: { content: sample, compact: false, interactiveChecklists: false },
};

export const Compact: Story = {
  args: { content: sample, compact: true, interactiveChecklists: false },
};
