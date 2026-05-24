import type { Meta, StoryObj } from '@storybook/vue3';

import {
  sidebarPanelCollapsedFrameDecorator,
  sidebarPanelFrameDecorator,
  withStores,
} from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import SidebarPanel from './SidebarPanel.vue';

const meta = {
  title: 'Layout/SidebarPanel',
  component: SidebarPanel,
  decorators: [withStores],
  parameters: {
    docs: {
      vueUsage: ({ collapsed = false, mobile = false }) =>
        parts(
          `<SidebarPanel
    :collapsed="collapsed"
    :mobile="mobile"
    @toggle-collapse="onToggleCollapse"
    @close-drawer="onCloseDrawer"
    @logout="onLogout"
  />`,
          `${scriptSeedStores()}

${importLine('SidebarPanel', '~/components/layout/SidebarPanel.vue')}

const collapsed = ${Boolean(collapsed)}
const mobile = ${Boolean(mobile)}

function onToggleCollapse() {
  // basculer collapsed côté parent
}

function onCloseDrawer() {
  // fermer le drawer mobile
}

function onLogout() {
  // déconnexion
}`,
        ),
    },
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
