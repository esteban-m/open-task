import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest'

import { writeGeneratedDoc } from '../src/services/writer.mjs'

describe('writeGeneratedDoc', () => {
  it('sanitizes and writes under baseDir', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'docs-writer-'));
    try {
      const target = path.join(dir, 'out.md');
      await writeGeneratedDoc(target, '# Title\n<script>x</script>\n', { baseDir: dir });
      const content = await readFile(target, 'utf8');
      expect(content).toContain('# Title');
      expect(content).not.toContain('<script>');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
