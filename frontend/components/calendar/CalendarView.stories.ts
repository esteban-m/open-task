import type { Meta, StoryObj } from '@storybook/vue3';

import { wideDecorator, withStores } from '../../.storybook/decorators';
import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import CalendarView from './CalendarView.vue';

const meta = {
  title: 'Calendar/CalendarView',
  component: CalendarView,
  tags: ['autodocs'],
  decorators: [withStores, wideDecorator],
  parameters: {
    layout: 'fullscreen',
    ...vueUsageSnippet('<CalendarView />'),
  },
} satisfies Meta<typeof CalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { CalendarView },
    template: '<div class="h-[480px] flex flex-col"><CalendarView /></div>',
  }),
};
