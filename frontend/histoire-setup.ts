import { defineSetupVue3 } from '@histoire/plugin-vue';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import { DEFAULT_THEME_ID } from './config/themes';

import './assets/css/main.css';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap';

export const setupVue3 = defineSetupVue3(({ app }) => {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }

  document.documentElement.setAttribute('data-theme', DEFAULT_THEME_ID);

  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  });

  app.use(pinia);
  app.use(router);
});
