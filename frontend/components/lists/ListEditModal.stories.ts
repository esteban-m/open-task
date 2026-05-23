import type { Meta, StoryObj } from '@storybook/vue3';
import { fn } from 'storybook/test';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import ListEditModal from './ListEditModal.vue';

const meta = {
  title: 'Lists/ListEditModal',
  component: ListEditModal,
  decorators: [withStores],
  parameters: { layout: 'centered' },
  args: {
    list: mockList,
    onClose: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof ListEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
