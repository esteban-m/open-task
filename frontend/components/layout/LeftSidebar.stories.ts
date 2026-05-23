import type { Meta, StoryObj } from '@storybook/vue3';

import { withStores } from '../../.storybook/decorators';
import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import LeftSidebar from './LeftSidebar.vue';

const meta = {
  title: 'Layout/LeftSidebar',
  component: LeftSidebar,
  tags: ['autodocs'],
  decorators: [withStores],
  parameters: vueUsageSnippet('<LeftSidebar />'),
} satisfies Meta<typeof LeftSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { LeftSidebar },
    template: '<div class="w-72 h-[560px] border border-border rounded-lg overflow-hidden"><LeftSidebar /></div>',
  }),
};
