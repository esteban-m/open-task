import { defineSetupVue3 } from '@histoire/plugin-vue';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import { DEFAULT_THEME_ID } from './config/themes';
import './assets/main.css';

export const setupVue3 = defineSetupVue3(({ app }) => {
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
  document.documentElement.setAttribute('data-theme', DEFAULT_THEME_ID);
});
