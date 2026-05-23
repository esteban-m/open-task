import type { Meta, StoryObj } from '@storybook/vue3';

import { mockTask } from '../../.storybook/fixtures';
import { rightSidebarFrameDecorator, withStores } from '../../.storybook/decorators';
import { useTasksStore } from '../../stores/tasks';
import RightSidebar from './RightSidebar.vue';

const meta = {
  title: 'Layout/RightSidebar',
  component: RightSidebar,
  decorators: [withStores, rightSidebarFrameDecorator],
} satisfies Meta<typeof RightSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSelection: Story = {
  play: () => {
    useTasksStore().selectTask(mockTask.id);
  },
};

export const Empty: Story = {};
