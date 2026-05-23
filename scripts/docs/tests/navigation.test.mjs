import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import {
  buildAllowedLinksForPrompt,
  buildSidebar,
  collectValidLinks,
  fileExists,
} from '../src/services/navigation.mjs';

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

  it('fileExists returns false for missing paths', async () => {
    expect(await fileExists(path.join(repoRoot, '__missing__'))).toBe(false);
  });
});

describe('buildSidebar', () => {
  const vitestDir = path.join(repoRoot, '.vitest-docs-nav');

  afterEach(async () => {
    await rm(vitestDir, { recursive: true, force: true });
  });

  it('includes static, generated and chapter items when files exist', async () => {
    const docsDir = path.join(vitestDir, 'docs');
    const generatedDir = path.join(docsDir, 'generated');
    await mkdir(path.join(docsDir, 'guide'), { recursive: true });
    await mkdir(generatedDir, { recursive: true });
    await writeFile(path.join(docsDir, 'guide/getting-started.md'), '# Start\n', 'utf8');
    await writeFile(path.join(generatedDir, 'architecture.md'), '# Arch\n', 'utf8');
    await mkdir(path.join(generatedDir, 'backend'), { recursive: true });
    await writeFile(path.join(generatedDir, 'backend/tasks.md'), '# Tasks\n', 'utf8');

    const config = {
      navigation: {
        home: { text: 'Home', link: '/' },
        categories: [{ id: 'core', text: 'Core', order: 1, expanded: true }],
        staticPages: [
          { category: 'core', title: 'Start', link: '/guide/getting-started' },
        ],
        generatedPages: [
          { category: 'core', title: 'Architecture', link: '/generated/architecture', file: 'architecture.md' },
        ],
      },
      chapters: [{ category: 'core', path: 'backend/tasks', title: 'Tasks' }],
    };

    const sidebar = await buildSidebar(config, { docsDir, generatedDir });
    const core = sidebar.find((s) => s.text === 'Core');
    expect(core?.items?.map((i) => i.link)).toEqual(
      expect.arrayContaining([
        '/guide/getting-started',
        '/generated/architecture',
        '/generated/backend/tasks',
      ]),
    );
  });
});
