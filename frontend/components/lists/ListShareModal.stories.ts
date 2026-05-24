import type { Meta, StoryObj } from '@storybook/vue3';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import ListShareModal from './ListShareModal.vue';

const meta = {
  title: 'Lists/ListShareModal',
  component: ListShareModal,
  decorators: [withStores],
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: ({
        listId = mockList.id,
        listName = mockList.name,
        visible = true,
      }) =>
        parts(
          `<ListShareModal
    :list-id="listId"
    :list-name="listName"
    :visible="visible"
    @close="onClose"
    @refresh="onRefresh"
  />`,
          `${scriptSeedStores()}

${importLine('ListShareModal', '~/components/lists/ListShareModal.vue')}

const listId = ${JSON.stringify(listId)}
const listName = ${JSON.stringify(listName)}
const visible = ${Boolean(visible)}

function onClose() {
  // fermer le modal
}

function onRefresh() {
  // recharger les partages
}`,
        ),
    },
  },
  args: {
    listId: mockList.id,
    listName: mockList.name,
    visible: true,
  },
} satisfies Meta<typeof ListShareModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
