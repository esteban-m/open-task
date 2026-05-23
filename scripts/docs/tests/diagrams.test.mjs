import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildDiagramBlock,
  injectDiagram,
  injectDiagramsIntoDir,
  stripDiagramSections,
} from '../src/services/diagrams.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const vitestDir = path.join(repoRoot, '.vitest-docs-diagrams');

describe('diagrams', () => {
  afterEach(async () => {
    await rm(vitestDir, { recursive: true, force: true });
  });

  it('injectDiagram inserts mermaid after heading', () => {
    const md = '## Foo\n\nText\n\n## Bar\n';
    const out = injectDiagram(md, {
      afterHeading: '## Foo',
      sectionTitle: '### Diagramme',
      mermaid: 'flowchart LR\n  A --> B',
    });
    expect(out).toContain('### Diagramme');
    expect(out).toContain('```mermaid');
    expect(out.indexOf('### Diagramme')).toBeLessThan(out.indexOf('## Bar'));
  });

  it('stripDiagramSections removes injected blocks', () => {
    const md = '## Foo\n\n### Diagramme\n\n```mermaid\nx\n```\n\n## Bar';
    const out = stripDiagramSections(md, [{ sectionTitle: '### Diagramme' }]);
    expect(out).not.toContain('```mermaid');
  });

  it('injectDiagram skips when section already present', () => {
    const md = '## Foo\n\n### Diagramme\n\n```mermaid\nx\n```';
    const out = injectDiagram(md, {
      afterHeading: '## Foo',
      sectionTitle: '### Diagramme',
      mermaid: 'flowchart LR',
    });
    expect(out).toBe(md);
  });

  it('injectDiagram appends when heading is missing', () => {
    const md = '# Doc';
    const out = injectDiagram(md, {
      afterHeading: '## Missing',
      sectionTitle: '### Diagramme',
      mermaid: 'flowchart LR',
    });
    expect(out).toContain('### Diagramme');
    expect(out.endsWith('```\n')).toBe(true);
  });

  it('buildDiagramBlock formats mermaid fence', () => {
    expect(buildDiagramBlock('## T', '  graph LR  ')).toContain('```mermaid\ngraph LR');
  });

  it('injectDiagramsIntoDir writes diagrams into chapter files', async () => {
    await mkdir(vitestDir, { recursive: true });
    const chapter = 'architecture';
    await writeFile(path.join(vitestDir, `${chapter}.md`), '## Vue\n\nTexte\n', 'utf8');

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await injectDiagramsIntoDir(
      vitestDir,
      [
        {
          chapterPath: chapter,
          afterHeading: '## Vue',
          sectionTitle: '### Schéma',
          mermaid: 'flowchart LR\n  A --> B',
        },
      ],
      readFile,
      writeFile,
    );

    const md = await readFile(path.join(vitestDir, `${chapter}.md`), 'utf8');
    expect(md).toContain('### Schéma');
    expect(md).toContain('flowchart LR');
    expect(log).toHaveBeenCalledWith('[diagrams] architecture');
    log.mockRestore();
  });
});
