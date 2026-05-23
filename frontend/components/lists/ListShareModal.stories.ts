import type { Meta, StoryObj } from '@storybook/vue3';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import ListShareModal from './ListShareModal.vue';

const meta = {
  title: 'Lists/ListShareModal',
  component: ListShareModal,
  tags: ['autodocs'],
  decorators: [withStores],
  args: {
    listId: mockList.id,
    listName: mockList.name,
    visible: true,
  },
} satisfies Meta<typeof ListShareModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
