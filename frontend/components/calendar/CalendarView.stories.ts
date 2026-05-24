import type { Meta, StoryObj } from '@storybook/vue3';

import { calendarFrameDecorator, wideDecorator, withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import CalendarView from './CalendarView.vue';

const meta = {
  title: 'Calendar/CalendarView',
  component: CalendarView,
  decorators: [withStores, wideDecorator, calendarFrameDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      vueUsage: parts(
        '<CalendarView />',
        `${scriptSeedStores()}

${importLine('CalendarView', '~/components/calendar/CalendarView.vue')}`,
      ),
    },
  },
} satisfies Meta<typeof CalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
