const SCRIPT_THEN_TEMPLATE =
  /^<script\b[^>]*>([\s\S]*?)<\/script>\s*<template>\s*([\s\S]*?)\s*<\/template>\s*$/i;

export type VueUsageParts = {
  template: string | null;
  script: string | null;
};

/** Storybook Vue met parfois le `<script>` avant le `<template>`. */
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

/** Déduit un import Nuxt à partir du titre CSF (ex. UI/AppLogo). */
export function guessComponentImport(storyTitle: string, templateSource: string): string | null {
  const tagMatch = templateSource.match(/<([A-Z][A-Za-z0-9]*)/);
  if (!tagMatch) return null;

  const componentName = tagMatch[1];
  const segments = storyTitle.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const folder = segments[segments.length - 2]!.toLowerCase();
  return `import ${componentName} from '~/components/${folder}/${componentName}.vue'`;
}

/** Sépare le snippet dynamique en encarts Template / Script. */
export function splitVueUsageSource(source: string, storyTitle = ''): VueUsageParts {
  const normalized = reorderVueSfc(source.trim());
  if (!normalized) return { template: null, script: null };

  const templateMatch = normalized.match(/<template>\s*([\s\S]*?)\s*<\/template>/i);
  const scriptMatch = normalized.match(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/i);

  const templateInner = templateMatch?.[1]?.trim() ?? null;
  const template = templateInner
    ? `<template>\n  ${templateInner}\n</template>`
    : null;

  const scriptBody = scriptMatch?.[2]?.trim() ?? '';
  const scriptOpen = scriptMatch?.[1] ?? '<script setup lang="ts">';

  let script: string | null = null;
  if (scriptBody) {
    script = `${scriptOpen}\n${scriptBody}\n</script>`;
  } else if (templateInner && storyTitle) {
    const importLine = guessComponentImport(storyTitle, templateInner);
    if (importLine) {
      script = `<script setup lang="ts">\n${importLine}\n</script>`;
    }
  }

  return { template, script };
}
