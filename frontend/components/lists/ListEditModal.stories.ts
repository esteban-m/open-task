import type { Meta, StoryObj } from '@storybook/vue3';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import ListEditModal from './ListEditModal.vue';

const meta = {
  title: 'Lists/ListEditModal',
  component: ListEditModal,
  tags: ['autodocs'],
  decorators: [withStores],
  args: {
    list: mockList,
  },
} satisfies Meta<typeof ListEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
