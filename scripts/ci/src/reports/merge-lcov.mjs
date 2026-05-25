import { readFileSync, writeFileSync } from 'node:fs';

function parseRecords(content) {
  const records = [];
  let cur = null;

  for (const line of content.split(/\r?\n/)) {
    if (line === 'end_of_record') {
      if (cur) records.push(cur);
      cur = null;
      continue;
    }
    if (line.startsWith('SF:')) {
      cur = { sf: line.slice(3), meta: [], da: new Map(), brda: new Map() };
      continue;
    }
    if (!cur) continue;

    if (line.startsWith('DA:')) {
      const [ln, hit] = line.slice(3).split(',');
      const n = Number(ln);
      const h = Number(hit);
      cur.da.set(n, Math.max(cur.da.get(n) ?? 0, h));
      continue;
    }

    if (line.startsWith('BRDA:')) {
      const key = line.slice(5);
      const hit = key.split(',').at(-1);
      const prev = cur.brda.get(key);
      const covered = (prev && prev !== '0' && prev !== '-') || (hit !== '0' && hit !== '-');
      cur.brda.set(key, covered ? hit === '0' || hit === '-' ? prev || '1' : hit : '0');
      continue;
    }

    if (
      !line.startsWith('LF:')
      && !line.startsWith('LH:')
      && !line.startsWith('BRF:')
      && !line.startsWith('BRH:')
    ) {
      cur.meta.push(line);
    }
  }

  return records;
}

function serializeRecord(rec) {
  const lines = [...rec.da.keys()].sort((a, b) => a - b);
  let lh = 0;
  const out = [`SF:${rec.sf}`, ...rec.meta];
  for (const ln of lines) {
    const hit = rec.da.get(ln) ?? 0;
    out.push(`DA:${ln},${hit}`);
    if (hit > 0) lh += 1;
  }
  out.push(`LF:${lines.length}`, `LH:${lh}`);

  if (rec.brda.size > 0) {
    let brh = 0;
    for (const [key, hit] of rec.brda) {
      out.push(`BRDA:${key}`);
      if (hit !== '0' && hit !== '-') brh += 1;
    }
    out.push(`BRF:${rec.brda.size}`, `BRH:${brh}`);
  }

  out.push('end_of_record');
  return out.join('\n');
}

/** Union LCOV (ligne couverte si au moins un rapport la touche). */
export function mergeLcov(files) {
  const bySf = new Map();

  for (const file of files) {
    for (const rec of parseRecords(readFileSync(file, 'utf8'))) {
      const existing = bySf.get(rec.sf);
      if (!existing) {
        bySf.set(rec.sf, {
          sf: rec.sf,
          meta: [...rec.meta],
          da: new Map(rec.da),
          brda: new Map(rec.brda),
        });
        continue;
      }

      for (const [ln, hit] of rec.da) {
        existing.da.set(ln, Math.max(existing.da.get(ln) ?? 0, hit));
      }

      for (const [key, hit] of rec.brda) {
        const prev = existing.brda.get(key);
        const covered = (prev && prev !== '0' && prev !== '-') || (hit !== '0' && hit !== '-');
        existing.brda.set(key, covered ? hit === '0' || hit === '-' ? prev || '1' : hit : '0');
      }
    }
  }

  return `${[...bySf.values()].map(serializeRecord).join('\n')}\n`;
}

export function parseMergeLcovArgs(argv) {
  const inputs = [];
  let output = 'coverage-merged.lcov.info';
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '-o' && argv[i + 1]) {
      output = argv[++i];
    } else {
      inputs.push(argv[i]);
    }
  }
  if (inputs.length === 0) {
    throw new Error('Usage: merge-lcov -o out.info file1.info [file2.info ...]');
  }
  return { inputs, output };
}

export function runMergeLcov(argv = process.argv) {
  const { inputs, output } = parseMergeLcovArgs(argv);
  writeFileSync(output, mergeLcov(inputs), 'utf8');
  console.log(`[merge-lcov] ${inputs.length} fichier(s) → ${output}`);
}
