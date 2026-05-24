import type { Meta, StoryObj } from '@storybook/vue3';

import { mockList } from '../../.storybook/fixtures';
import { withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import ListEditModal from './ListEditModal.vue';

const meta = {
  title: 'Lists/ListEditModal',
  component: ListEditModal,
  decorators: [withStores],
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: ({ list = mockList }) =>
        parts(
          '<ListEditModal :list="list" @close="onClose" @saved="onSaved" />',
          `${scriptSeedStores()}

${importLine('ListEditModal', '~/components/lists/ListEditModal.vue')}

const list = ${JSON.stringify(list, null, 2)} as const

function onClose() {
  // fermer le modal
}

function onSaved() {
  // rafraîchir les listes
}`,
        ),
    },
  },
  args: {
    list: mockList,
  },
} satisfies Meta<typeof ListEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
