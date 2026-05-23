import type { StorybookConfig } from '@storybook-vue/nuxt';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';

const storybookBase = process.env.STORYBOOK_BASE ?? '/';
const frontendRoot = dirname(fileURLToPath(new URL('../', import.meta.url)));

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        vueDocgenOptions: {
          alias: {
            '~': frontendRoot,
            '@': frontendRoot,
          },
        },
      },
    },
  ],
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
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
