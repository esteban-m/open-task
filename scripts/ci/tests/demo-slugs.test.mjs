import { describe, expect, it } from 'vitest';

import {
  detectVariantFromDirName,
  parseResultDir,
  resolveSlugFromDirName,
} from '../src/playwright/demo-slugs.mjs';

describe('demo-slugs', () => {
  it('resolveSlugFromDirName via numéro tronqué', () => {
    expect(resolveSlugFromDirName('demo-03-vues-kanban-calend-ea844-demo-desktop')).toBe(
      '03-vues-kanban-calendrier',
    );
    expect(resolveSlugFromDirName('demo-08-calendrier-echelles-trunc-demo-mobile')).toBe(
      '08-calendrier-echelles',
    );
  });

  it('detectVariantFromDirName', () => {
    expect(detectVariantFromDirName('foo-demo-desktop-bar')).toBe('desktop');
    expect(detectVariantFromDirName('foo-demo-mobile-bar')).toBe('mobile');
  });

  it('parseResultDir combine slug et variant', () => {
    expect(parseResultDir('demo-02-liste-tache-x-demo-desktop', null)).toEqual({
      slug: '02-liste-tache',
      variant: 'desktop',
    });
  });
});
