import type { Meta, StoryObj } from '@storybook/vue3';

import { mainContentFrameDecorator, wideDecorator, withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import MainContent from './MainContent.vue';

const meta = {
  title: 'Layout/MainContent',
  component: MainContent,
  decorators: [withStores, wideDecorator, mainContentFrameDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      vueUsage: parts(
        '<MainContent />',
        `${scriptSeedStores()}

${importLine('MainContent', '~/components/layout/MainContent.vue')}`,
      ),
    },
  },
} satisfies Meta<typeof MainContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListView: Story = {};
