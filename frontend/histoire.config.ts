import { fileURLToPath, URL } from 'node:url';

import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { HstVue } from '@histoire/plugin-vue';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'histoire';
import AutoImport from 'unplugin-auto-import/vite';

const histoireBase = process.env.HISTOIRE_BASE?.replace(/\/?$/, '/') ?? '/';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const nuxtAppMock = fileURLToPath(new URL('./histoire/mocks/nuxt-app.ts', import.meta.url));

export default defineConfig({
  plugins: [HstVue()],
  outDir: 'histoire-static',
  routerMode: 'hash',
  setupFile: {
    browser: './histoire-setup.ts',
  },
  collectMaxThreads: 1,
  storyMatch: ['**/components/**/*.story.vue'],
  theme: {
    title: 'Open-Task — Composants',
    favicon: './public/hero.svg',
    defaultColorScheme: 'dark',
  },
  responsivePresets: [
    { label: 'Mobile', width: 375 },
    { label: 'Tablet', width: 768 },
    { label: 'Desktop', width: 1280 },
  ],
  backgroundPresets: [
    { label: 'App surface', color: '#0f0f10' },
    { label: 'Light', color: '#f4f4f5', contrastColor: '#18181b' },
  ],
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
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
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
