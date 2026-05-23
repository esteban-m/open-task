import type { Meta, StoryObj } from '@storybook/vue3';

import { vueUsageSnippet } from '../../.storybook/vue-usage-snippet';
import ConfirmModal from './ConfirmModal.vue';

const meta = {
  title: 'Layout/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
  parameters: vueUsageSnippet(`<ConfirmModal
  title="Supprimer la liste ?"
  message="Cette action est irréversible."
  confirm-label="Supprimer"
  @confirm="onConfirm"
  @cancel="onCancel"
/>`),
  args: {
    title: 'Supprimer la liste ?',
    message: 'Cette action est irréversible. Toutes les tâches associées seront supprimées.',
    confirmLabel: 'Supprimer',
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
