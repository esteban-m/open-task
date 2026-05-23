import type { Meta, StoryObj } from '@storybook/vue3';

import { sidebarFrameDecorator, withStores } from '../../.storybook/decorators';
import LeftSidebar from './LeftSidebar.vue';

const meta = {
  title: 'Layout/LeftSidebar',
  component: LeftSidebar,
  decorators: [withStores, sidebarFrameDecorator],
} satisfies Meta<typeof LeftSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
