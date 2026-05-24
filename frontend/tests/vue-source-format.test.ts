import { describe, expect, it } from 'vitest';

import { reorderVueSfc } from '../.storybook/vue-source-format';

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
