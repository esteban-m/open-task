import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  mergeLcov,
  parseMergeLcovArgs,
  parseRecords,
  runMergeLcov,
  serializeRecord,
} from '../src/reports/merge-lcov.mjs';

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

  it('parseRecords lit LF invalide et serializeRecord gère DA undefined', () => {
    const records = parseRecords(`SF:src/lf.ts
LF:bad
DA:2,1
end_of_record
`);
    expect(records[0].lf).toBe(0);

    const da = new Map([[1, undefined], [2, 1]]);
    const out = serializeRecord({
      sf: 'src/undef.ts',
      meta: [],
      da,
      brda: new Map(),
      lf: 2,
    });
    expect(out).toContain('DA:1,0');
    expect(out).toContain('DA:2,1');
  });

  it('parseRecords marque une branche non couverte', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-parse-brda-'));
    const a = path.join(dir, 'a.info');
    writeFileSync(
      a,
      `SF:src/branch.ts
DA:1,1
BRDA:2,0,0,0
BRDA:2,0,1,-
LF:1
LH:1
BRF:2
BRH:0
end_of_record
`,
    );
    expect(mergeLcov([a])).toContain('BRDA:2,0,0,0');
  });

  it('parseMergeLcovArgs exige des entrées', () => {
    expect(() => parseMergeLcovArgs(['node', 'cli'])).toThrow(/Usage/);
  });

  it('unionne deux rapports sans branche couverte', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-brda-miss-'));
    const a = path.join(dir, 'a.info');
    const b = path.join(dir, 'b.info');
    const rec = `SF:src/z.ts
DA:1,0
BRDA:1,0,0,0
LF:1
LH:0
BRF:1
BRH:0
end_of_record
`;
    writeFileSync(a, rec);
    writeFileSync(b, rec);
    expect(mergeLcov([a, b])).toContain('BRDA:1,0,0,0');
  });

  it('unionne BRDA en conservant une branche déjà couverte', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-brda-prev-'));
    const a = path.join(dir, 'a.info');
    const b = path.join(dir, 'b.info');
    writeFileSync(
      a,
      `SF:src/y.ts
DA:1,1
BRDA:1,0,0,1
LF:1
LH:1
BRF:1
BRH:1
end_of_record
`,
    );
    writeFileSync(
      b,
      `SF:src/y.ts
DA:1,1
BRDA:1,0,0,0
LF:1
LH:1
BRF:1
BRH:0
end_of_record
`,
    );
    const merged = mergeLcov([a, b]);
    expect(merged).toContain('BRDA:1,0,0,1');
    expect(merged).toContain('BRH:1');
  });

  it('unionne BRDA et fusionne deux enregistrements SF', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-brda-'));
    const a = path.join(dir, 'a.info');
    const b = path.join(dir, 'b.info');
    writeFileSync(
      a,
      `SF:src/x.ts
DA:1,1
BRDA:1,0,0,0
BRDA:2,0,0,1
LF:1
LH:1
BRF:2
BRH:1
end_of_record
`,
    );
    writeFileSync(
      b,
      `SF:src/x.ts
DA:1,0
DA:2,1
BRDA:1,0,0,1
BRDA:2,0,0,0
LF:2
LH:1
BRF:2
BRH:1
end_of_record
`,
    );

    const merged = mergeLcov([a, b]);
    expect(merged).toContain('DA:1,1');
    expect(merged).toContain('DA:2,1');
    expect(merged).toContain('BRDA:1,0,0,1');
    expect(merged).toContain('BRH:2');
  });

  it('comble les lignes LF sans entrée DA', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-lf-'));
    const a = path.join(dir, 'a.info');
    writeFileSync(
      a,
      `SF:src/sparse.ts
DA:2,1
LF:3
LH:1
end_of_record
`,
    );
    const merged = mergeLcov([a]);
    expect(merged).toContain('DA:1,0');
    expect(merged).toContain('DA:2,1');
    expect(merged).toContain('DA:3,0');
    expect(merged).toContain('LH:1');
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

  it('conserve les métadonnées FN/FNDA du LCOV', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'lcov-meta-'));
    const a = path.join(dir, 'a.info');
    writeFileSync(
      a,
      `SF:src/meta.ts
FN:1,myFn
FNDA:1,myFn
DA:1,1
LF:1
LH:1
end_of_record
`,
    );
    const merged = mergeLcov([a]);
    expect(merged).toContain('FN:1,myFn');
    expect(merged).toContain('FNDA:1,myFn');
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
