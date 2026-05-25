import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { mergeLcov, parseMergeLcovArgs, runMergeLcov } from '../src/reports/merge-lcov.mjs';

describe('merge-lcov', () => {
  it('parseMergeLcovArgs lit -o et les entrées', () => {
    const { inputs, output } = parseMergeLcovArgs([
      'node',
      'cli',
      '-o',
      'out.info',
      'a.info',
      'b.info',
    ]);
    expect(output).toBe('out.info');
    expect(inputs).toEqual(['a.info', 'b.info']);
  });

  it('unionne les hits de ligne (unit + e2e)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-'));
    const unit = path.join(dir, 'unit.info');
    const e2e = path.join(dir, 'e2e.info');
    writeFileSync(
      unit,
      `SF:src/auth.service.ts
DA:1,1
DA:2,1
LF:2
LH:2
end_of_record
`,
    );
    writeFileSync(
      e2e,
      `SF:src/auth.service.ts
DA:1,0
DA:2,0
DA:3,1
LF:3
LH:1
end_of_record
`,
    );

    const merged = mergeLcov([unit, e2e]);
    expect(merged).toContain('DA:1,1');
    expect(merged).toContain('DA:2,1');
    expect(merged).toContain('DA:3,1');
    expect(merged).toContain('LH:3');
  });

  it('runMergeLcov écrit le fichier de sortie', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-run-'));
    const a = path.join(dir, 'a.info');
    const out = path.join(dir, 'merged.info');
    writeFileSync(
      a,
      `SF:file.ts
DA:1,1
LF:1
LH:1
end_of_record
`,
    );
    runMergeLcov(['node', 'cli', '-o', out, a]);
    expect(readFileSync(out, 'utf8')).toContain('SF:file.ts');
  });
});
