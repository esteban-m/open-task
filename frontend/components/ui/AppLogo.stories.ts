import type { Meta, StoryObj } from '@storybook/vue3';

import { importLine, parts } from '../../.storybook/vue-usage';
import AppLogo from './AppLogo.vue';

const meta = {
  title: 'UI/AppLogo',
  component: AppLogo,
  parameters: {
    layout: 'centered',
    docs: {
      vueUsage: ({ size = 'sm' }) =>
        parts(
          '<AppLogo :size="size" />',
          `${importLine('AppLogo', '~/components/ui/AppLogo.vue')}

const size = ${JSON.stringify(size)} as const`,
        ),
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof AppLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };
