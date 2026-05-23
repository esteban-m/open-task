import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest'

import { bundleSources } from '../src/services/sources.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

describe('bundleSources', () => {
  it('bundles existing repo files', async () => {
    const bundle = await bundleSources(repoRoot, ['README.md'], {
      maxCharsPerFile: 5000,
      maxTotalChars: 10000,
    });

    expect(bundle).toContain('### Source: `README.md`');
    expect(bundle).toContain('Open-Task');
  });

  it('notes missing files', async () => {
    const bundle = await bundleSources(repoRoot, ['__missing__.md'], {});
    expect(bundle).toContain('fichier introuvable');
  });

  it('truncates large files and skips when bundle limit exceeded', async () => {
    const bundle = await bundleSources(repoRoot, ['README.md', 'package.json'], {
      maxCharsPerFile: 20,
      maxTotalChars: 80,
    });
    expect(bundle).toContain('tronqué');
    expect(bundle).toContain('limite de contexte');
  });
});
