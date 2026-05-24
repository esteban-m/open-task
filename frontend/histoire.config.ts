import { fileURLToPath, URL } from 'node:url';

import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { HstVue } from '@histoire/plugin-vue';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'histoire';
import AutoImport from 'unplugin-auto-import/vite';

/**
 * @histoire/plugin-nuxt est prévu pour ce cas (https://github.com/histoire-dev/histoire/tree/main/packages/histoire-plugin-nuxt)
 * mais échoue encore sur Nuxt 3.21 en collecte (#build/nuxt.config.mjs). On réutilise la config Vite/Nuxt
 * minimale ci-dessous jusqu'à compatibilité upstream ; les mocks dans histoire/mocks/ comblent les auto-imports.
 */
const histoireBase = process.env.HISTOIRE_BASE?.replace(/\/?$/, '/') ?? '/';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const nuxtMocks = fileURLToPath(new URL('./histoire/mocks/nuxt-app.ts', import.meta.url));

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
  viteNodeInlineDeps: ['marked', 'isomorphic-dompurify', 'dompurify'],
  vite: {
    base: histoireBase,
    resolve: {
      alias: {
        '~': rootDir,
        '@': rootDir,
        '#app': nuxtMocks,
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
            [nuxtMocks]: ['useNuxtApp', 'useRuntimeConfig', '$fetch', 'useState'],
          },
        ],
        dirs: ['composables', 'stores'],
        dts: false,
        vueTemplate: true,
      }),
    ],
  },
});
