import type { Meta, StoryObj } from '@storybook/vue3';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import ListEditModal from './ListEditModal.vue';

const meta = {
  title: 'Lists/ListEditModal',
  component: ListEditModal,
  tags: ['autodocs'],
  decorators: [withStores],
  parameters: vueUsageSnippet('<ListEditModal :list="list" @close="onClose" @saved="onSaved" />'),
  args: {
    list: mockList,
  },
} satisfies Meta<typeof ListEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
