import type { Meta, StoryObj } from '@storybook/vue3';

import { wideDecorator, withStores } from '../../.storybook/decorators';
import KanbanView from './KanbanView.vue';

const meta = {
  title: 'Kanban/KanbanView',
  component: KanbanView,
  tags: ['autodocs'],
  decorators: [withStores, wideDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof KanbanView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { KanbanView },
    template: '<div class="h-[420px] flex flex-col"><KanbanView /></div>',
  }),
};
