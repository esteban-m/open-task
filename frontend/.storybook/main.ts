import type { StorybookConfig } from '@storybook-vue/nuxt';
import { mergeConfig } from 'vite';

const storybookBase = process.env.STORYBOOK_BASE ?? '/';

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    return mergeConfig(config, {
      base: storybookBase,
    });
  },
};

export default config;
