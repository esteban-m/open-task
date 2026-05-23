import type { StorybookConfig } from '@storybook-vue/nuxt';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';

const storybookBase = process.env.STORYBOOK_BASE ?? '/';
const frontendRoot = dirname(fileURLToPath(new URL('../', import.meta.url)));

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    const merged = mergeConfig(config, { base: storybookBase });
    // @storybook-vue/nuxt merges Nuxt vite config after; keep GH Pages base path.
    merged.base = storybookBase;
    return merged;
  },
};

export default config;
