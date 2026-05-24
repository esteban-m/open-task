import type { StoryContext } from '@storybook/vue3';

const SCRIPT_THEN_TEMPLATE =
  /^<script\b[^>]*>([\s\S]*?)<\/script>\s*<template>\s*([\s\S]*?)\s*<\/template>\s*$/i;

/** Storybook Vue met le `<script>` avant le `<template>` — ordre SFC réel : template puis script. */
export function reorderVueSfc(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return trimmed;

  const match = trimmed.match(SCRIPT_THEN_TEMPLATE);
  if (!match) return trimmed;

  const [, scriptBody, templateBody] = match;
  const template = `<template>\n  ${templateBody.trim()}\n</template>`;
  const scriptInner = scriptBody.trim();
  if (!scriptInner) return template;

  const scriptOpen = trimmed.match(/^<script\b[^>]*>/i)?.[0] ?? '<script setup lang="ts">';
  return `${template}\n\n${scriptOpen}\n${scriptInner}\n</script>`;
}

/** Panneau Code : snippet d’intégration Vue (template d’abord, comme un .vue). */
export function formatVueUsageSource(source: string, _context: StoryContext): string {
  return reorderVueSfc(source);
}
