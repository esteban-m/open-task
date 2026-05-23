/** GIF attendus par variant (05 = mobile uniquement). */
export const EXPECTED_BY_VARIANT = {
  desktop: [
    '01-inscription',
    '02-liste-tache',
    '03-vues-kanban-calendrier',
    '04-connexion',
    '06-themes',
    '07-kanban-drag',
    '08-calendrier-echelles',
    '09-partage-liste',
  ],
  mobile: [
    '01-inscription',
    '02-liste-tache',
    '03-vues-kanban-calendrier',
    '04-connexion',
    '05-mobile-navigation',
    '06-themes',
    '07-kanban-drag',
    '08-calendrier-echelles',
    '09-partage-liste',
  ],
};

/** Slugs stables (ordre : les plus longs en premier). */
export const DEMO_SLUGS = [
  '09-partage-liste',
  '08-calendrier-echelles',
  '07-kanban-drag',
  '06-themes',
  '05-mobile-navigation',
  '04-connexion',
  '03-vues-kanban-calendrier',
  '02-liste-tache',
  '01-inscription',
];

/**
 * Dossiers Playwright du type demo-03-vues-kanban-calendrier.demo.t-…-demo-desktop.
 * Les noms sont tronqués (~100 car.) : includes(slug complet) rate pour 03 et 08.
 */
export function resolveSlugFromDirName(name) {
  const num = name.match(/demo-(0[1-9])-/);
  if (num) {
    const slug = DEMO_SLUGS.find((s) => s.startsWith(`${num[1]}-`));
    if (slug) return slug;
  }
  return DEMO_SLUGS.find((s) => name.includes(s)) ?? null;
}

export function detectVariantFromDirName(name) {
  if (/demo-mobil/i.test(name)) return 'mobile';
  if (/demo-desk/i.test(name)) return 'desktop';
  return null;
}

export function parseResultDir(name, variantFromParent) {
  const variant = variantFromParent ?? detectVariantFromDirName(name);
  if (!variant) return null;
  const slug = resolveSlugFromDirName(name);
  if (!slug) return null;
  return { slug, variant };
}
