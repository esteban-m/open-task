import type { Meta, StoryObj } from '@storybook/vue3';

import { useToast } from '../../composables/useToast';
import ToastContainer from './ToastContainer.vue';

const meta = {
  title: 'UI/ToastContainer',
  component: ToastContainer,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithToasts: Story = {
  play: () => {
    const toast = useToast();
    toast.success('Liste créée avec succès');
    toast.error('Impossible de supprimer la tâche');
    toast.info('Invitation envoyée');
  },
};

export const Empty: Story = {};
