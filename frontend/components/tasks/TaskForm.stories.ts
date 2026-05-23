import type { Meta, StoryObj } from '@storybook/vue3';

import { withStores } from '../../.storybook/decorators';
import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import TaskForm from './TaskForm.vue';

const meta = {
  title: 'Tasks/TaskForm',
  component: TaskForm,
  tags: ['autodocs'],
  decorators: [withStores],
  parameters: vueUsageSnippet('<TaskForm />'),
} satisfies Meta<typeof TaskForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
