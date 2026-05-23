import type { Meta, StoryObj } from '@storybook/vue3';

import ThemePicker from './ThemePicker.vue';

const meta = {
  title: 'UI/ThemePicker',
  component: ThemePicker,
  tags: ['autodocs'],
  argTypes: {
    collapsed: { control: 'boolean' },
  },
  decorators: [
    () => ({
      template: '<div class="w-64 p-4 bg-surface border border-border rounded-lg"><story /></div>',
    }),
  ],
} satisfies Meta<typeof ThemePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { collapsed: false },
};

export const Collapsed: Story = {
  args: { collapsed: true },
};
