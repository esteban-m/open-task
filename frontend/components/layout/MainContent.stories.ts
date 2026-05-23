import type { Meta, StoryObj } from '@storybook/vue3';

import { wideDecorator, withStores } from '../../.storybook/decorators';
import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import MainContent from './MainContent.vue';

const meta = {
  title: 'Layout/MainContent',
  component: MainContent,
  tags: ['autodocs'],
  decorators: [withStores, wideDecorator],
  parameters: {
    layout: 'fullscreen',
    ...vueUsageSnippet('<MainContent />'),
  },
} satisfies Meta<typeof MainContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListView: Story = {
  render: () => ({
    components: { MainContent },
    template: '<div class="h-[560px] flex flex-col border border-border rounded-lg overflow-hidden"><MainContent /></div>',
  }),
};
