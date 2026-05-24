import type { Meta, StoryObj } from '@storybook/vue3';

import { sidebarFrameDecorator, withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import LeftSidebar from './LeftSidebar.vue';

const meta = {
  title: 'Layout/LeftSidebar',
  component: LeftSidebar,
  decorators: [withStores, sidebarFrameDecorator],
  parameters: {
    docs: {
      vueUsage: parts(
        '<LeftSidebar />',
        `${scriptSeedStores()}

${importLine('LeftSidebar', '~/components/layout/LeftSidebar.vue')}`,
      ),
    },
  },
} satisfies Meta<typeof LeftSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
