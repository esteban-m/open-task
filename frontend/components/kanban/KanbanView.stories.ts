import type { Meta, StoryObj } from '@storybook/vue3';

import { kanbanFrameDecorator, wideDecorator, withStores } from '../../.storybook/decorators';
import { importLine, parts, scriptSeedStores } from '../../.storybook/vue-usage';
import KanbanView from './KanbanView.vue';

const meta = {
  title: 'Kanban/KanbanView',
  component: KanbanView,
  decorators: [withStores, wideDecorator, kanbanFrameDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      vueUsage: parts(
        '<KanbanView />',
        `${scriptSeedStores()}

${importLine('KanbanView', '~/components/kanban/KanbanView.vue')}`,
      ),
    },
  },
} satisfies Meta<typeof KanbanView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
