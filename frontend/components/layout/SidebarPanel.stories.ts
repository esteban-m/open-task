import type { Meta, StoryObj } from '@storybook/vue3';
import { fn } from 'storybook/test';

import {
  sidebarPanelCollapsedFrameDecorator,
  sidebarPanelFrameDecorator,
  withStores,
} from '../../.storybook/decorators';
import SidebarPanel from './SidebarPanel.vue';

const meta = {
  title: 'Layout/SidebarPanel',
  component: SidebarPanel,
  decorators: [withStores],
  args: {
    onToggleCollapse: fn(),
  },
  argTypes: {
    collapsed: { control: 'boolean' },
    mobile: { control: 'boolean' },
  },
} satisfies Meta<typeof SidebarPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { collapsed: false, mobile: false },
  decorators: [withStores, sidebarPanelFrameDecorator],
};

export const Collapsed: Story = {
  args: { collapsed: true, mobile: false },
  decorators: [withStores, sidebarPanelCollapsedFrameDecorator],
};
