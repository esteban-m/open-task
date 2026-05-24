import type { Meta, StoryObj } from '@storybook/vue3';

import { importLine, parts } from '../../.storybook/vue-usage';
import ConfirmModal from './ConfirmModal.vue';

const meta = {
  title: 'Layout/ConfirmModal',
  component: ConfirmModal,
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: ({
        title = 'Supprimer la liste ?',
        message = 'Cette action est irréversible. Toutes les tâches associées seront supprimées.',
        confirmLabel = 'Supprimer',
      }) =>
        parts(
          `<ConfirmModal
    :title="title"
    :message="message"
    :confirm-label="confirmLabel"
    @confirm="onConfirm"
    @cancel="onCancel"
  />`,
          `${importLine('ConfirmModal', '~/components/layout/ConfirmModal.vue')}

const title = ${JSON.stringify(title)}
const message = ${JSON.stringify(message)}
const confirmLabel = ${JSON.stringify(confirmLabel)}

function onConfirm() {
  // action destructive
}

function onCancel() {
  // fermer le modal
}`,
        ),
    },
  },
  args: {
    title: 'Supprimer la liste ?',
    message: 'Cette action est irréversible. Toutes les tâches associées seront supprimées.',
    confirmLabel: 'Supprimer',
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
