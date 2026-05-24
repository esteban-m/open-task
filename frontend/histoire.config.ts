import { fileURLToPath, URL } from 'node:url';

import { HstVue } from '@histoire/plugin-vue';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'histoire';
import AutoImport from 'unplugin-auto-import/vite';

const histoireBase = process.env.HISTOIRE_BASE?.replace(/\/?$/, '/') ?? '/';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const nuxtAppMock = fileURLToPath(new URL('./histoire/mocks/nuxt-app.ts', import.meta.url));

export default defineConfig({
  plugins: [HstVue()],
  outDir: 'storybook-static',
  routerMode: 'hash',
  setupFile: {
    browser: './histoire-setup.ts',
  },
  collectMaxThreads: 1,
  storyMatch: ['**/components/**/*.story.vue'],
  theme: {
    title: 'Open-Task',
    favicon: './public/hero.svg',
    defaultColorScheme: 'dark',
  },
  viteNodeInlineDeps: [
    'marked',
    'isomorphic-dompurify',
    'dompurify',
  ],
  vite: {
    base: histoireBase,
    resolve: {
      alias: {
        '~': rootDir,
        '@': rootDir,
        '#app': nuxtAppMock,
      },
    },
    plugins: [
      vue(),
      AutoImport({
        imports: [
          'vue',
          'pinia',
          'vue-router',
          {
            [nuxtAppMock]: ['useNuxtApp', 'useRuntimeConfig', '$fetch'],
          },
        ],
        dirs: ['composables', 'stores'],
        dts: false,
        vueTemplate: true,
      }),
    ],
  },
});
