import { demoSlugs, loadE2eConfig } from '../core/e2e-config.mjs';

/**
 * Dossiers Playwright du type demo-03-vues-kanban-calendrier.demo.t-…-demo-desktop.
 * Les noms sont tronqués (~100 car.) : includes(slug complet) rate pour 03 et 08.
 */
export function resolveSlugFromDirName(name, config = loadE2eConfig()) {
  const slugs = demoSlugs(config);
  const num = name.match(/demo-(0[1-9])-/);
  if (num) {
    const slug = slugs.find((s) => s.startsWith(`${num[1]}-`));
    if (slug) return slug;
  }
  return slugs.find((s) => name.includes(s)) ?? null;
}

export function detectVariantFromDirName(name) {
  if (/demo-mobil/i.test(name)) return 'mobile';
  if (/demo-desk/i.test(name)) return 'desktop';
  return null;
}

export function parseResultDir(name, variantFromParent, config = loadE2eConfig()) {
  const variant = variantFromParent ?? detectVariantFromDirName(name);
  if (!variant) return null;
  const slug = resolveSlugFromDirName(name, config);
  if (!slug) return null;
  return { slug, variant };
}

export { demoSlugs, expectedGifsByVariant } from '../core/e2e-config.mjs';
