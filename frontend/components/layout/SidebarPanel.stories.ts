import type { Meta, StoryObj } from '@storybook/vue3';

import { withStores } from '../../.storybook/decorators';
import SidebarPanel from './SidebarPanel.vue';

const meta = {
  title: 'Layout/SidebarPanel',
  component: SidebarPanel,
  tags: ['autodocs'],
  decorators: [withStores],
  argTypes: {
    collapsed: { control: 'boolean' },
    mobile: { control: 'boolean' },
  },
} satisfies Meta<typeof SidebarPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { collapsed: false, mobile: false },
  render: (args) => ({
    components: { SidebarPanel },
    setup: () => ({ args }),
    template: '<div class="w-72 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col"><SidebarPanel v-bind="args" @toggle-collapse="() => {}" /></div>',
  }),
};

export const Collapsed: Story = {
  args: { collapsed: true, mobile: false },
  render: (args) => ({
    components: { SidebarPanel },
    setup: () => ({ args }),
    template: '<div class="w-16 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col"><SidebarPanel v-bind="args" @toggle-collapse="() => {}" /></div>',
  }),
};
