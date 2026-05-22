import { describe, expect, it } from 'vitest'

import { buildDiagramBlock, injectDiagram, stripDiagramSections } from '../src/services/diagrams.mjs'

describe('diagrams', () => {
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
});
