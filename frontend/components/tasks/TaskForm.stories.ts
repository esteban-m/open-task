import type { Meta, StoryObj } from '@storybook/vue3';

import { withStores } from '../../.storybook/decorators';
import TaskForm from './TaskForm.vue';

const meta = {
  title: 'Tasks/TaskForm',
  component: TaskForm,
  tags: ['autodocs'],
  decorators: [withStores],
} satisfies Meta<typeof TaskForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
