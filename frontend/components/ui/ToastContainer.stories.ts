import type { Meta, StoryObj } from '@storybook/vue3';

import ToastContainer from './ToastContainer.vue';
import { useToast } from '../../composables/useToast';

const meta = {
  title: 'UI/ToastContainer',
  component: ToastContainer,
  tags: ['autodocs'],
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithToasts: Story = {
  render: () => ({
    components: { ToastContainer },
    setup() {
      const toast = useToast();
      toast.success('Liste créée avec succès');
      toast.error('Impossible de supprimer la tâche');
      toast.info('Invitation envoyée');
      return {};
    },
    template: '<ToastContainer />',
  }),
};

export const Empty: Story = {};
