import type { Meta, StoryObj } from '@storybook/vue3';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import ListShareModal from './ListShareModal.vue';

const meta = {
  title: 'Lists/ListShareModal',
  component: ListShareModal,
  tags: ['autodocs'],
  decorators: [withStores],
  parameters: vueUsageSnippet(`<ListShareModal
  :list-id="list.id"
  :list-name="list.name"
  :visible="true"
  @close="onClose"
/>`),
  args: {
    listId: mockList.id,
    listName: mockList.name,
    visible: true,
  },
} satisfies Meta<typeof ListShareModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
