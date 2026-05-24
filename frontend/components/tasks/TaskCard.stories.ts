import type { Meta, StoryObj } from '@storybook/vue3';

import { mockTask, mockTaskDone } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import {
  importLine,
  parts,
  scriptSeedStores,
  scriptSelectTask,
} from '../../.storybook/vue-usage';
import { useTasksStore } from '../../stores/tasks';
import TaskCard from './TaskCard.vue';

const meta = {
  title: 'Tasks/TaskCard',
  component: TaskCard,
  decorators: [withStores],
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: ({ task = mockTask }) =>
        parts(
          '<TaskCard :task="task" />',
          `${scriptSeedStores()}

${importLine('TaskCard', '~/components/tasks/TaskCard.vue')}

const task = ${JSON.stringify(task, null, 2)} as const`,
        ),
    },
  },
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
  parameters: {
    docs: {
      vueUsage: parts(
        '<TaskCard :task="task" />',
        `${scriptSeedStores()}

${scriptSelectTask(mockTask.id)}

${importLine('TaskCard', '~/components/tasks/TaskCard.vue')}

const task = ${JSON.stringify(mockTask, null, 2)} as const`,
      ),
    },
  },
};
