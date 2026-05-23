import type { Meta, StoryObj } from '@storybook/vue3';

import { mockTask } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import { useTasksStore } from '../../stores/tasks';
import RightSidebar from './RightSidebar.vue';

const meta = {
  title: 'Layout/RightSidebar',
  component: RightSidebar,
  tags: ['autodocs'],
  decorators: [withStores],
} satisfies Meta<typeof RightSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSelection: Story = {
  render: () => ({
    components: { RightSidebar },
    setup() {
      useTasksStore().selectTask(mockTask.id);
      return {};
    },
    template: '<div class="w-80 h-[560px] border border-border rounded-lg overflow-hidden"><RightSidebar /></div>',
  }),
};

export const Empty: Story = {
  render: () => ({
    components: { RightSidebar },
    template: '<div class="w-80 h-[560px] border border-border rounded-lg overflow-hidden"><RightSidebar /></div>',
  }),
};
