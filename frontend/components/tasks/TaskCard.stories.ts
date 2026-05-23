import type { Meta, StoryObj } from '@storybook/vue3';

import { mockTask, mockTaskDone } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import { useTasksStore } from '../../stores/tasks';
import TaskCard from './TaskCard.vue';

const meta = {
  title: 'Tasks/TaskCard',
  component: TaskCard,
  decorators: [withStores],
  parameters: { layout: 'centered' },
  argTypes: {
    task: { control: 'object' },
  },
} satisfies Meta<typeof TaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { task: mockTask } };
export const Completed: Story = { args: { task: mockTaskDone } };

export const Selected: Story = {
  args: { task: mockTask },
  play: () => {
    useTasksStore().selectTask(mockTask.id);
  },
};
