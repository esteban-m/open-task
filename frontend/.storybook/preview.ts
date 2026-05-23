import type { Preview } from '@storybook/vue3';
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';

import '../assets/css/main.css';
import { DEFAULT_THEME_ID } from '../config/themes';
import { codePanelParameters } from './code-panel';
import { themeDecorator } from './decorators';

const pinia = createPinia();

setup((app) => {
  app.use(pinia);
  if (import.meta.client) {
    document.documentElement.setAttribute('data-theme', DEFAULT_THEME_ID);
  }
});

const preview: Preview = {
  decorators: [themeDecorator],
  parameters: {
    ...codePanelParameters,
    layout: 'padded',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: ['UI', 'Layout', 'Tasks', 'Lists', 'Kanban', 'Calendar', 'Common'],
      },
    },
  },
};

export default preview;
