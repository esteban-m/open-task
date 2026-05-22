import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { buildAllowedLinksForPrompt, collectValidLinks } from '../src/services/navigation.mjs';

const minimalConfig = {
  navigation: {
    generatedPages: [{ link: '/generated/architecture', file: 'architecture.md' }],
    staticPages: [{ link: '/guide/getting-started', title: 'Start' }],
    categories: [],
    home: { text: 'Home', link: '/' },
  },
  chapters: [{ path: 'backend/tasks', title: 'Tasks' }],
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const generatedDir = path.join(repoRoot, 'docs/generated');

describe('navigation', () => {
  it('buildAllowedLinksForPrompt includes static and generated links', () => {
    const links = buildAllowedLinksForPrompt(minimalConfig);
    expect(links).toContain('/generated/architecture');
    expect(links).toContain('/generated/backend/tasks');
    expect(links).toContain('/guide/getting-started');
  });

  it('collectValidLinks merges config and scanned files', async () => {
    const links = await collectValidLinks(minimalConfig, generatedDir);
    expect(links.has('/generated/architecture')).toBe(true);
    expect(links.has('/guide/getting-started')).toBe(true);
  });
});
