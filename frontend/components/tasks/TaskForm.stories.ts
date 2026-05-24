import type { Meta, StoryObj } from '@storybook/vue3';

import { withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import TaskForm from './TaskForm.vue';

const meta = {
  title: 'Tasks/TaskForm',
  component: TaskForm,
  decorators: [withStores],
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: parts(
        '<TaskForm @created="onTaskCreated" />',
        `${scriptSeedStores()}

${importLine('TaskForm', '~/components/tasks/TaskForm.vue')}

function onTaskCreated() {
  // recharger les tâches ou naviguer
}`,
      ),
    },
  },
} satisfies Meta<typeof TaskForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
