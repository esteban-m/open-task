import { describe, expect, it } from 'vitest';

import { buildManifest, validateExpectedGifs } from '../src/playwright/videos-to-gifs.mjs';

describe('videos-to-gifs helpers', () => {
  it('buildManifest liste desktop et mobile', () => {
    const md = buildManifest([
      { slug: '01-inscription', variant: 'desktop' },
      { slug: '01-inscription', variant: 'mobile' },
    ]);
    expect(md).toContain('01-inscription');
    expect(md).toContain('desktop/01-inscription.gif');
    expect(md).toContain('mobile/01-inscription.gif');
  });

  it('validateExpectedGifs signale les GIF manquants', () => {
    const missing = validateExpectedGifs([{ slug: '01-inscription', variant: 'desktop' }]);
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((m) => m.includes('mobile/01-inscription'))).toBe(true);
  });
});
