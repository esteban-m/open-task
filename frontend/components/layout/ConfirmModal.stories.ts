import type { Meta, StoryObj } from '@storybook/vue3';
import { fn } from 'storybook/test';

import ConfirmModal from './ConfirmModal.vue';

const meta = {
  title: 'Layout/ConfirmModal',
  component: ConfirmModal,
  parameters: { layout: 'centered' },
  args: {
    title: 'Supprimer la liste ?',
    message: 'Cette action est irréversible. Toutes les tâches associées seront supprimées.',
    confirmLabel: 'Supprimer',
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
