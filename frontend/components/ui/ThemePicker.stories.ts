import type { Meta, StoryObj } from '@storybook/vue3';

import { themePickerFrameDecorator } from '../../.storybook/decorators';
import { importLine, parts } from '../../.storybook/vue-usage';
import ThemePicker from './ThemePicker.vue';

const meta = {
  title: 'UI/ThemePicker',
  component: ThemePicker,
  decorators: [themePickerFrameDecorator],
  parameters: {
    docs: {
      vueUsage: ({ collapsed = false }) =>
        parts(
          '<ThemePicker :collapsed="collapsed" />',
          `${importLine('ThemePicker', '~/components/ui/ThemePicker.vue')}

const collapsed = ${Boolean(collapsed)}`,
        ),
    },
  },
  argTypes: {
    collapsed: { control: 'boolean' },
  },
} satisfies Meta<typeof ThemePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = { args: { collapsed: false } };
export const Collapsed: Story = { args: { collapsed: true } };
