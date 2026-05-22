import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest'

import { createPaths } from '../src/core/paths.mjs'

describe('createPaths', () => {
  it('resolves docs paths from config', () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const paths = createPaths(repoRoot, {
      paths: {
        docsDir: 'docs',
        generatedDir: 'docs/generated',
        prismaSchema: 'backend/prisma/schema.prisma',
        backendSrc: 'backend/src',
        vitepressSidebar: 'docs/.vitepress/sidebar.generated.json',
        manifestFile: 'docs/generated/.doc-manifest.json',
      },
    });

    expect(paths.docsDir).toBe(path.join(repoRoot, 'docs'));
    expect(paths.generatedFile('architecture.md')).toContain('docs/generated/architecture.md');
    expect(paths.chapterFile('backend/tasks')).toContain('backend/tasks.md');
  });
});
