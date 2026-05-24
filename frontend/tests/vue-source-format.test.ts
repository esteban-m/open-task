import { describe, expect, it } from 'vitest';

import {
  guessComponentImport,
  reorderVueSfc,
  splitVueUsageSource,
} from '../.storybook/vue-source-format';

describe('reorderVueSfc', () => {
  it('place le template avant le script (ordre .vue)', () => {
    const input = `<script lang="ts" setup>
import { fn } from 'storybook/test';
const onClick = fn();
</script>

<template>
  <ThemePicker :collapsed="false" @click="onClick" />
</template>`;

    expect(reorderVueSfc(input)).toBe(`<template>
  <ThemePicker :collapsed="false" @click="onClick" />
</template>

<script lang="ts" setup>
import { fn } from 'storybook/test';
const onClick = fn();
</script>`);
  });

  it('laisse un snippet template-only inchangé', () => {
    const input = `<template>
  <AppLogo size="sm" />
</template>`;
    expect(reorderVueSfc(input)).toBe(input);
  });
});

describe('splitVueUsageSource', () => {
  it('sépare template et script en deux encarts', () => {
    const source = `<script lang="ts" setup>
import { fn } from 'storybook/test';
const onClick = fn();
</script>

<template>
  <ThemePicker :collapsed="false" @click="onClick" />
</template>`;

    expect(splitVueUsageSource(source, 'UI/ThemePicker')).toEqual({
      template: `<template>
  <ThemePicker :collapsed="false" @click="onClick" />
</template>`,
      script: `<script lang="ts" setup>
import { fn } from 'storybook/test';
const onClick = fn();
</script>`,
    });
  });

  it('propose un import Nuxt quand il n’y a pas de script dynamique', () => {
    const source = `<template>
  <AppLogo size="sm" />
</template>`;

    expect(splitVueUsageSource(source, 'UI/AppLogo')).toEqual({
      template: `<template>
  <AppLogo size="sm" />
</template>`,
      script: `<script setup lang="ts">
import AppLogo from '~/components/ui/AppLogo.vue'
</script>`,
    });
  });
});

describe('guessComponentImport', () => {
  it('déduit le chemin depuis le titre CSF', () => {
    expect(guessComponentImport('Layout/LeftSidebar', '<LeftSidebar />')).toBe(
      "import LeftSidebar from '~/components/layout/LeftSidebar.vue'",
    );
  });
});
